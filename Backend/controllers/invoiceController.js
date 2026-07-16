const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Generates systematic custom invoice sequencing strings
const generateInvoiceNumber = async () => {
  const currentYear = new Date().getFullYear();
  const prefix = `INV-${currentYear}-`;
  const lastInvoice = await Invoice.findOne({ invoiceNumber: new RegExp(`^${prefix}`) }).sort({ createdAt: -1 });

  let sequenceNum = 1;
  if (lastInvoice) {
    const lastSequence = parseInt(lastInvoice.invoiceNumber.replace(prefix, ''), 10);
    if (!isNaN(lastSequence)) {
      sequenceNum = lastSequence + 1;
    }
  }
  return `${prefix}${String(sequenceNum).padStart(4, '0')}`;
};

// @desc     Create new transaction invoice or process an isolated full customer return loop
// @route    POST /api/invoices
// @access   Private
// @desc     Create new transaction invoice or process an isolated full customer return loop
// @route    POST /api/invoices
// @access   Private
const createInvoice = async (req, res) => {
  try {
    const { customer, items, taxAmount, discountAmount, paymentStatus, partialAmount, digitalSignature } = req.body;
    
    if (!customer || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Customer ID and an array of items are required.' });
    }

    const isPureReturnInvoice = items.every(item => item.status === 'returned');

    let calculatedSubTotal = 0;
    let totalReturnCredit = 0;
    const processedItems = [];
    const internalReturnedHistory = [];

    // 💡 FIXED: Process, adjust, and save inside a single unified loop to handle duplicate products flawlessly
    for (const item of items) {
      const { product: productId, quantity, pricePerUnit, unitType, status } = item;
      const parsedQuantity = Number(quantity) || 0;
      const itemStatus = status || 'included';
      const selectedUnit = unitType || 'piece';

      // Always fetch the freshest state from the database
      const productObj = await Product.findById(productId);
      if (!productObj) return res.status(400).json({ message: `Product ${productId} not found.` });

      const isCartonMode = selectedUnit === 'cartoon' && productObj.packagingType === 'cartoon';
      const conversionMultiplier = isCartonMode ? productObj.piecesPerCartoon : 1;
      
      const targetPiecesVolume = parsedQuantity * conversionMultiplier;
      const computedUnitPrice = pricePerUnit * conversionMultiplier;
      const absoluteLineCost = computedUnitPrice * parsedQuantity;

      if (itemStatus === 'included') {
        if (isCartonMode) {
          if (productObj.cartoonCount < parsedQuantity) {
            return res.status(400).json({ 
              message: `Stock not available for ${productObj.name}. Only ${productObj.cartoonCount} cartons left.` 
            });
          }
        } else {
          if (productObj.stockQuantity < targetPiecesVolume) {
            return res.status(400).json({ 
              message: `Stock not available for ${productObj.name}. Only ${productObj.stockQuantity} pieces left.` 
            });
          }
        }
        
        calculatedSubTotal += absoluteLineCost;
        
        // Apply stock deduction instantly
        productObj.stockQuantity = Math.max(0, productObj.stockQuantity - targetPiecesVolume);
      } else if (itemStatus === 'returned') {
        totalReturnCredit += absoluteLineCost;
        
        // Apply return addition instantly
        productObj.stockQuantity = productObj.stockQuantity + targetPiecesVolume;
      }

      // Recalculate carton structures directly on the fresh stock volume
      if (productObj.packagingType === 'cartoon' && productObj.piecesPerCartoon > 0) {
        productObj.cartoonCount = Math.floor(productObj.stockQuantity / productObj.piecesPerCartoon);
        productObj.individualPieces = productObj.stockQuantity % productObj.piecesPerCartoon;
      } else {
        productObj.cartoonCount = 0;
        productObj.piecesPerCartoon = 0;
        productObj.individualPieces = 0;
      }

      // Mark modified paths and commit to DB immediately before moving to the next item line
      productObj.markModified('stockQuantity');
      productObj.markModified('cartoonCount');
      productObj.markModified('individualPieces');
      await productObj.save();

      processedItems.push({ 
        product: productId, 
        quantity: parsedQuantity, 
        pricePerUnit, 
        unitType: selectedUnit,
        piecesPerCartoon: Number(productObj.piecesPerCartoon) || 0,
        status: itemStatus, 
        rowTotal: itemStatus === 'returned' ? -absoluteLineCost : absoluteLineCost 
      });
    }

    const finalTaxAmount = Number(taxAmount) || 0;
    const finalDiscountAmount = Number(discountAmount) || 0;
    
    let finalGrandTotal = 0;
    let computedAmountPaid = 0;
    let finalPaymentStatus = paymentStatus || 'Paid';
    
    const internalPaymentsLog = [];

    if (isPureReturnInvoice) {
      calculatedSubTotal = 0;
      finalGrandTotal = 0;
      computedAmountPaid = 0;
      finalPaymentStatus = 'Paid'; 

      internalReturnedHistory.push({
        returnedAmount: Math.abs(totalReturnCredit),
        returnedAt: new Date(),
        notes: 'Customer Return Processing Logic Loop'
      });
    } else {
      finalGrandTotal = Math.max(0, calculatedSubTotal + finalTaxAmount - finalDiscountAmount);
      const remainingLiquidBalanceDue = Math.max(0, finalGrandTotal - totalReturnCredit);

      if (totalReturnCredit > 0) {
        internalReturnedHistory.push({
          returnedAmount: Math.abs(totalReturnCredit),
          returnedAt: new Date(),
          notes: 'Partial product credit deducted during checkout sequence execution.'
        });
      }

      if (finalPaymentStatus === 'Paid') {
        computedAmountPaid = remainingLiquidBalanceDue;
      } else if (finalPaymentStatus === 'Partial') {
        const initialInstallment = Number(partialAmount) || 0;
        if (initialInstallment <= 0 || initialInstallment >= remainingLiquidBalanceDue) {
          return res.status(400).json({ 
            message: `Partial payment amount must range between ₹0 and the net total due: ₹${remainingLiquidBalanceDue.toFixed(2)}` 
          });
        }
        computedAmountPaid = initialInstallment;
        internalPaymentsLog.push({ amountCollected: initialInstallment, collectedAt: new Date() });
      } else {
        computedAmountPaid = 0; 
      }
    }

    const generatedNum = await generateInvoiceNumber();

    const newInvoice = new Invoice({
      invoiceNumber: generatedNum, 
      customer, 
      items: processedItems,
      subTotal: calculatedSubTotal, 
      taxAmount: isPureReturnInvoice ? 0 : finalTaxAmount,
      discountAmount: isPureReturnInvoice ? 0 : finalDiscountAmount,
      grandTotal: finalGrandTotal,
      amountPaid: computedAmountPaid,
      paymentStatus: finalPaymentStatus, 
      partialPayments: internalPaymentsLog,
      returnedHistory: internalReturnedHistory, 
      digitalSignature: digitalSignature || "ABHISHEK_TRADING_TERMINAL_SIGN"
    });

    const savedInvoice = await newInvoice.save();

    const fullyPopulatedInvoice = await Invoice.findById(savedInvoice._id)
      .populate('customer')
      .populate('items.product');

    return res.status(201).json({ 
      message: isPureReturnInvoice ? 'Isolated store credit return mapped successfully.' : 'Invoice processed successfully.', 
      invoice: fullyPopulatedInvoice 
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error processing invoice.', error: error.message });
  }
};

const getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate('customer')
      .populate('items.product')
      .sort({ createdAt: -1 });
    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching invoices.', error: error.message });
  }
};

const updateInvoiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus, verificationPassword, incomingPaymentAmount } = req.body;

    if (!verificationPassword) {
      return res.status(400).json({ message: 'Administrative credentials are required to modify records.' });
    }

    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Authorization failed. Session token missing or invalid.' });
    }

    const adminUser = await User.findById(userId);
    if (!adminUser) {
      return res.status(404).json({ message: 'User profile not found in database registry.' });
    }

    const isAuthorized = await bcrypt.compare(verificationPassword, adminUser.password);
    if (!isAuthorized) {
      return res.status(401).json({ message: 'Invalid administrative password credential override.' });
    }

    const targetInvoice = await Invoice.findById(id);
    if (!targetInvoice) {
      return res.status(404).json({ message: 'Invoice record line index not found.' });
    }

    const rowReturnsSum = (targetInvoice.returnedHistory || []).reduce((acc, r) => acc + (Number(r.returnedAmount) || 0), 0);
    const realNetGrandTotal = Math.max(0, targetInvoice.grandTotal - rowReturnsSum);

    if (paymentStatus === 'Partial') {
      const freshAmountInput = Number(incomingPaymentAmount) || 0;
      if (freshAmountInput <= 0) {
        return res.status(400).json({ message: 'Provide an installment amount above ₹0.' });
      }

      const missingDeficitRemainder = realNetGrandTotal - targetInvoice.amountPaid;
      if (freshAmountInput > missingDeficitRemainder) {
        return res.status(400).json({ message: `Overpayment blocked. Remainder due is ₹${missingDeficitRemainder.toFixed(2)}` });
      }

      targetInvoice.amountPaid += freshAmountInput;
      targetInvoice.partialPayments.push({ amountCollected: freshAmountInput, collectedAt: new Date() });

      if (targetInvoice.amountPaid >= realNetGrandTotal) {
        targetInvoice.paymentStatus = 'Paid';
        targetInvoice.amountPaid = realNetGrandTotal;
      } else {
        targetInvoice.paymentStatus = 'Partial';
      }
    } else if (paymentStatus === 'Paid') {
      const outstandingDueBalance = realNetGrandTotal - targetInvoice.amountPaid;
      if (outstandingDueBalance > 0) {
        targetInvoice.partialPayments.push({
          amountCollected: outstandingDueBalance,
          collectedAt: new Date()
        });
      }
      targetInvoice.amountPaid = realNetGrandTotal;
      targetInvoice.paymentStatus = 'Paid';
    } else {
      targetInvoice.paymentStatus = paymentStatus;
      if (paymentStatus === 'Pending') {
        targetInvoice.amountPaid = 0;
        targetInvoice.partialPayments = []; 
      }
    }

    // Explicit path tracking before saving status adjustments
    targetInvoice.markModified('amountPaid');
    targetInvoice.markModified('paymentStatus');
    targetInvoice.markModified('partialPayments');

    await targetInvoice.save();

    const updatedInvoice = await Invoice.findById(id)
      .populate('customer')
      .populate('items.product');

    res.status(200).json(updatedInvoice);
  } catch (error) {
    res.status(500).json({ message: 'Server error modifying invoice parameters.', error: error.message });
  }
};

module.exports = { createInvoice, getInvoices, updateInvoiceStatus };