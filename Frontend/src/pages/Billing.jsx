import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

const Billing = () => {
  // Core Telemetry Registries
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);

  // Active Invoice Parameter Matrix
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [transactionMode, setTransactionMode] = useState('sale'); // 'sale' or 'return'

  const [invoiceItems, setInvoiceItems] = useState([
    { id: Date.now(), product: '', quantity: 1, pricePerUnit: 0, unitType: 'piece', status: 'included', searchFocused: false, searchFilter: '' }
  ]);
  const [taxAmount, setTaxAmount] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
  const [partialAmount, setPartialAmount] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('Paid');

  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [completedInvoice, setCompletedInvoice] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorFeedback, setErrorFeedback] = useState('');

  const refreshCoreRecords = async () => {
    try {
      const [productsResponse, customersResponse] = await Promise.all([
        axios.get('/products'),
        axios.get('/customers')
      ]);
      setProducts(productsResponse.data || []);
      setCustomers(customersResponse.data || []);
    } catch (error) {
      console.error("Failed to sync core terminal telemetry data:", error.message);
    }
  };

  useEffect(() => { refreshCoreRecords(); }, []);

  useEffect(() => {
    setInvoiceItems(prev => prev.map(item => ({
      ...item,
      status: transactionMode === 'return' ? 'returned' : 'included'
    })));
  }, [transactionMode]);

  const filteredCustomers = useMemo(() => {
    const query = customerSearch.trim().toLowerCase();
    if (!query) return customers;
    return customers.filter(c => c.name.toLowerCase().includes(query) || c.phone.includes(query));
  }, [customerSearch, customers]);

  // 📊 COMPREHENSIVE CALCULATION LOGIC ENGINES (WITH CROSS-ROW RUNNING STOCK AGGREGATOR)
  const billingCalculations = useMemo(() => {
    let subTotal = 0;
    let totalReturnsCredit = 0;
    let hasInventoryDeficit = false;

    // 💡 STEP 1: Compute cumulative running piece totals for each product across all active billing rows
    const globalRunningPiecesMap = {};

    invoiceItems.forEach(item => {
      if (!item.product || item.status !== 'included') return;
      const targetProduct = products.find(p => p._id === item.product);
      if (!targetProduct) return;

      const pcsPerCtn = Number(targetProduct.piecesPerCartoon) || 1;
      const rowQuantity = Number(item.quantity) || 0;
      const isCarton = item.unitType === 'cartoon';

      const calculatedRowPieces = isCarton ? rowQuantity * pcsPerCtn : rowQuantity;

      globalRunningPiecesMap[item.product] = (globalRunningPiecesMap[item.product] || 0) + calculatedRowPieces;
    });

    // STEP 2: Analyze rows and cross-verify with our running total pieces restriction map
    const analyzedItems = invoiceItems.map(item => {
      const targetProduct = products.find(p => p._id === item.product);

      let maxAvailablePieces = 0;
      let displayStockLabel = '0 Pcs';
      let pcsPerCtn = 0;

      if (targetProduct) {
        maxAvailablePieces = targetProduct.stockQuantity;
        pcsPerCtn = Number(targetProduct.piecesPerCartoon) || 0;
        displayStockLabel = targetProduct.packagingType === 'cartoon'
          ? `${targetProduct.cartoonCount} Ctn / ${targetProduct.stockQuantity} Pcs`
          : `${targetProduct.stockQuantity} Pcs`;
      }

      const piecesMultiplier = (item.unitType === 'cartoon' && targetProduct) ? targetProduct.piecesPerCartoon : 1;
      const computedUnitPrice = item.pricePerUnit * piecesMultiplier;
      const absoluteLineCost = computedUnitPrice * (Number(item.quantity) || 0);
      const isIncluded = item.status === 'included';

      if (isIncluded) {
        subTotal += absoluteLineCost;
      } else if (item.status === 'returned') {
        totalReturnsCredit += absoluteLineCost;
      }

      // 💡 GLOBAL CHECK: Validate line items against total pooled pieces selected across all rows combined
      const pooledPiecesSelectedForProduct = globalRunningPiecesMap[item.product] || 0;
      const isOverStock = isIncluded && targetProduct && pooledPiecesSelectedForProduct > maxAvailablePieces;

      if (isOverStock) hasInventoryDeficit = true;

      return {
        ...item,
        name: targetProduct ? targetProduct.name : 'Unknown Product',
        rowTotal: isIncluded ? absoluteLineCost : -absoluteLineCost,
        availableStockLabel: displayStockLabel,
        isInvalid: isOverStock,
        piecesPerCartoon: pcsPerCtn,
        totalPooledSelected: pooledPiecesSelectedForProduct // Checked against maxAvailablePieces
      };
    });

    const parsedTax = Number(taxAmount) || 0;
    const parsedDiscount = Number(discountAmount) || 0;
    const grandTotal = Math.max(0, subTotal + parsedTax - parsedDiscount);
    const netDueTarget = Math.max(0, grandTotal - totalReturnsCredit);

    return {
      items: analyzedItems,
      subTotal,
      grandTotal,
      totalReturnsCredit,
      netDueTarget,
      hasInventoryDeficit,
      isBlocked: !selectedCustomer ||
        invoiceItems.length === 0 ||
        invoiceItems.some(i => !i.product || i.quantity === '') ||
        (transactionMode === 'sale' && hasInventoryDeficit) ||
        (transactionMode === 'sale' && paymentStatus === 'Partial' && (Number(partialAmount) <= 0 || Number(partialAmount) >= netDueTarget))
    };
  }, [invoiceItems, products, taxAmount, discountAmount, selectedCustomer, paymentStatus, partialAmount, transactionMode]);

  const appendRowItem = () => {
    setInvoiceItems(prev => [...prev, {
      id: Date.now(),
      product: '',
      quantity: '',
      pricePerUnit: 0,
      unitType: 'piece',
      status: transactionMode === 'return' ? 'returned' : 'included',
      searchFocused: false,
      searchFilter: ''
    }]);
  };

  const clearRowItem = (id) => {
    if (invoiceItems.length === 1) return;
    setInvoiceItems(prev => prev.filter(item => item.id !== id));
  };

  const modifyRowField = (id, field, value) => {
    setInvoiceItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const revisedItem = { ...item, [field]: value };

      if (field === 'product') {
        const match = products.find(p => p._id === value);
        revisedItem.pricePerUnit = match ? match.price : 0;
        revisedItem.unitType = match && match.packagingType === 'cartoon' ? 'cartoon' : 'piece';
        revisedItem.searchFilter = match ? `${match.sku}` : '';
        revisedItem.searchFocused = false;
      }
      return revisedItem;
    }));
  };

  const executeInvoiceCompilation = async (e) => {
    e?.preventDefault();
    if (billingCalculations.isBlocked) return;
    setIsSubmitting(true);
    setErrorFeedback('');

    try {
      const payload = {
        customer: selectedCustomer._id,
        items: billingCalculations.items.map(({ product, quantity, pricePerUnit, unitType, status }) => ({
          product,
          quantity: Number(quantity),
          pricePerUnit: Number(pricePerUnit),
          unitType,
          status
        })),
        taxAmount: transactionMode === 'return' ? 0 : (Number(taxAmount) || 0),
        discountAmount: transactionMode === 'return' ? 0 : (Number(discountAmount) || 0),
        paymentStatus: transactionMode === 'return' ? 'Paid' : paymentStatus,
        partialAmount: (transactionMode === 'sale' && paymentStatus === 'Partial') ? Number(partialAmount) : 0
      };

      const response = await axios.post('/invoices', payload);
      setCompletedInvoice(response.data.invoice);

      setSelectedCustomer(null);
      setCustomerSearch('');
      setInvoiceItems([{ id: Date.now(), product: '', quantity: 1, pricePerUnit: 0, unitType: 'piece', status: 'included', searchFocused: false, searchFilter: '' }]);
      setTaxAmount('');
      setDiscountAmount('');
      setPartialAmount('');
      setPaymentStatus('Paid');
      setTransactionMode('sale');

      await refreshCoreRecords();
    } catch (err) {
      setErrorFeedback(err.response?.data?.message || 'Transaction compilation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNumericInputClearance = (value, setterStateFunction) => {
    if (value === '') { setterStateFunction(''); return; }
    const parsedValue = parseFloat(value);
    setterStateFunction(isNaN(parsedValue) ? '' : parsedValue);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 w-full min-h-full overflow-y-auto font-sans">
      <div className="border-b border-zinc-200 pb-5 print:hidden">
        <h1 className="text-base font-bold tracking-tight text-zinc-900">New Sale (Billing Workspace)</h1>
        <p className="text-xs text-zinc-400 mt-0.5">Initialize customer transactions, process package-aware billing rows, and issue receipts.</p>
      </div>

      {errorFeedback && <div className="p-3.5 text-xs font-semibold border rounded-xl bg-red-50 border-red-200 text-red-800 print:hidden">⚠️ {errorFeedback}</div>}

      {completedInvoice ? (
        <div className="relative z-50 max-w-md mx-auto bg-white border border-zinc-200 shadow-xl rounded-2xl p-6 space-y-6 animate-scaleUp print:border-none print:shadow-none print:p-0 print:max-w-full my-4">
          <div className="text-center space-y-1 pb-2 border-b border-zinc-100">
            <div className="h-9 w-9 rounded-full bg-zinc-950 text-white flex items-center justify-center text-[10px] mx-auto font-black tracking-tighter print:bg-black print:text-white">AT</div>
            <h2 className="text-sm font-black uppercase tracking-normal leading-normal py-0.5 text-zinc-900 block">Abhishek Trading</h2>
            <p className="text-[10px] font-mono font-bold text-zinc-500 tracking-wider">GSTIN: 10CQPPK6688F1ZI</p>
            <p className="text-[10px] font-mono text-zinc-400 mt-0.5">Document No: {completedInvoice.invoiceNumber}</p>
          </div>

          <div className="border-t border-b border-dashed border-zinc-200 py-3 text-xs space-y-1.5 font-medium print:border-zinc-300">
            <div className="flex justify-between text-zinc-500 print:text-zinc-700"><span>Client Operator:</span><span className="font-bold text-zinc-900">{completedInvoice.customer?.name || 'Registered Account'}</span></div>
            <div className="flex justify-between text-zinc-500 print:text-zinc-700"><span>Phone Registry:</span><span className="font-mono text-zinc-900">{completedInvoice.customer?.phone}</span></div>
            <div className="flex justify-between text-zinc-500 print:text-zinc-700"><span>Settlement Status:</span><span className="px-1.5 py-0.5 text-[9px] font-black uppercase rounded-sm border bg-emerald-50 text-emerald-800">{completedInvoice.paymentStatus}</span></div>
          </div>

          <div className="space-y-2.5 text-xs">
            <span className="block text-[9px] font-black tracking-widest text-zinc-400 uppercase">Settled Line Items</span>
            <div className="divide-y divide-zinc-100 font-medium">
              {completedInvoice.items?.map((item, index) => {
                const isItemReturn = item.status === 'returned';
                const isCarton = item.unitType === 'cartoon';
                const pcsPerCtn = Number(item.piecesPerCartoon || (item.product ? item.product.piecesPerCartoon : 0)) || 0;
                const basePrice = Number(item.pricePerUnit) || 0;

                const totalCalculatedPieces = isCarton ? item.quantity * pcsPerCtn : item.quantity;
                const totalRowCost = Number(item.rowTotal) || (totalCalculatedPieces * basePrice);

                return (
                  <div key={index} className="py-2.5 flex justify-between items-start text-zinc-800 border-b border-zinc-100 last:border-none text-left">
                    <div className="space-y-0.5 w-full mr-4">
                      <p className="font-bold text-zinc-900 flex items-center gap-1 text-xs">
                        {item.product?.sku || 'Asset Component'}
                        <span className="text-[9px] px-1 bg-zinc-100 text-zinc-500 font-mono rounded normal-case">
                          {isCarton ? 'ctn' : 'pc'}
                        </span>
                        {isItemReturn && <span className="text-[8px] px-1 bg-zinc-100 text-red-600 rounded uppercase font-black tracking-wide border border-red-200">Returned</span>}
                      </p>

                      {isCarton ? (
                        <div className="text-[11px] text-zinc-500 space-y-0.5 font-medium mt-0.5">
                          <p className="font-mono text-zinc-400">
                            {item.quantity} ctn × {pcsPerCtn}/ctn = <span className="text-zinc-900 font-bold">{totalCalculatedPieces} pc</span>
                          </p>
                          <p className="font-mono text-zinc-600">
                            {totalCalculatedPieces} pc × ₹{basePrice.toFixed(2)}/pc
                          </p>
                        </div>
                      ) : (
                        <p className="text-[11px] text-zinc-600 font-mono font-medium mt-0.5">
                          {item.quantity} pc × ₹{basePrice.toFixed(2)}/pc
                        </p>
                      )}
                    </div>
                    <span className={`font-mono font-bold shrink-0 pt-0.5 text-xs ${isItemReturn ? 'text-red-600' : 'text-zinc-950'}`}>
                      {isItemReturn ? '-' : ''}₹{Math.abs(totalRowCost).toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-zinc-200 pt-3 space-y-2 text-xs font-bold text-zinc-600 print:border-zinc-300 print:text-zinc-800">
            <div className="flex justify-between"><span>Subtotal Balance</span><span className="font-mono text-zinc-900">₹{Number(completedInvoice.subTotal).toFixed(2)}</span></div>
            {completedInvoice.taxAmount > 0 && <div className="flex justify-between"><span>Tax Duty Assessment</span><span className="font-mono text-zinc-900">₹{Number(completedInvoice.taxAmount).toFixed(2)}</span></div>}
            {completedInvoice.discountAmount > 0 && <div className="flex justify-between text-red-600"><span>Discount Above Tax</span><span className="font-mono">-₹{Number(completedInvoice.discountAmount).toFixed(2)}</span></div>}

            <div className="flex justify-between items-baseline pt-2 border-t border-dashed border-zinc-100 text-zinc-900">
              <span className="uppercase text-[10px] tracking-wider">Grand Total Settled</span>
              <span className="text-lg font-black font-mono text-zinc-950">₹{Number(completedInvoice.grandTotal).toFixed(2)}</span>
            </div>

            {/* 💡 FIXED: Pulls the paid amount directly out of the verified server response */}
            <div className="flex justify-between items-center p-2 bg-emerald-50/60 rounded-xl text-emerald-900 font-bold border border-emerald-100 mt-2">
              <span className="text-xs uppercase tracking-wide">Total Amount Paid</span>
              <span className="font-mono text-sm font-black">₹{Number(completedInvoice.amountPaid).toFixed(2)}</span>
            </div>

            {/* 💡 FIXED: Computes balance deficit due directly from database outputs safely */}
            {Number(completedInvoice.grandTotal) - Number(completedInvoice.amountPaid) > 0 && (
              <div className="flex justify-between items-center p-2 bg-amber-50/60 rounded-xl text-amber-800 font-bold border border-amber-100 mt-1">
                <span className="text-xs uppercase tracking-wide">Balance Deficit Due</span>
                <span className="font-mono text-sm font-black">₹{(Number(completedInvoice.grandTotal) - Number(completedInvoice.amountPaid)).toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 print:hidden select-none">
            <button type="button" onClick={() => window.print()} className="w-full py-2 bg-white border border-zinc-200 text-zinc-900 font-bold text-xs uppercase tracking-wider rounded-xl shadow-3xs cursor-pointer">🖨️ Print Invoice</button>
            <button type="button" onClick={() => setCompletedInvoice(null)} className="w-full py-2 bg-zinc-900 text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer">Next Order ✓</button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start print:hidden">
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-2xs relative space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">Find Customer</label>
                <div className="mt-2 relative">
                  <input type="text" placeholder="Scan mobile number or trace account identity name..." value={customerSearch} onChange={(e) => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true); }} onFocus={() => setShowCustomerDropdown(true)} className="w-full text-sm rounded-xl border border-zinc-200 px-3.5 py-1.5 bg-white" />
                  {showCustomerDropdown && customerSearch && (
                    <div className="absolute left-0 right-0 mt-1.5 bg-white border border-zinc-200 shadow-xl rounded-xl z-50 max-h-44 overflow-y-auto divide-y divide-zinc-100">
                      {filteredCustomers.map(c => (
                        <button key={c._id} type="button" onClick={() => { setSelectedCustomer(c); setCustomerSearch(c.name); setShowCustomerDropdown(false); }} className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-zinc-50 text-zinc-900 flex justify-between items-center cursor-pointer"><span>{c.name}</span><span className="text-zinc-400 font-mono font-normal">{c.phone}</span></button>
                      ))}
                    </div>
                  )}
                </div>
                {selectedCustomer && (
                  <div className="mt-3 p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-between text-xs">
                    <div className="font-bold text-zinc-880"><span>{selectedCustomer.name}</span><span className="mx-2 text-zinc-300">|</span><span className="text-zinc-500 font-mono">{selectedCustomer.phone}</span></div>
                    <button type="button" onClick={() => { setSelectedCustomer(null); setCustomerSearch(''); setTransactionMode('sale'); }} className="text-zinc-400 hover:text-red-600 font-bold cursor-pointer">Unlink</button>
                  </div>
                )}
              </div>

              {selectedCustomer && (
                <div className="animate-fadeIn pt-1 border-t border-zinc-100">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 select-none mb-2">Select Transaction Mode Workspace</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setTransactionMode('sale')} className={`py-2 text-xs font-bold rounded-xl border transition cursor-pointer text-center ${transactionMode === 'sale' ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs' : 'bg-white text-zinc-600 border-zinc-200'}`}>📦 Order / Standard Sale</button>
                    <button type="button" onClick={() => setTransactionMode('return')} className={`py-2 text-xs font-bold rounded-xl border transition cursor-pointer text-center ${transactionMode === 'return' ? 'bg-red-50 border-red-300 text-red-700 font-black' : 'bg-white text-zinc-600 border-zinc-200'}`}>🔄 Customer Return Processing</button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white border border-zinc-200 rounded-xl shadow-2xs overflow-hidden">
              <div className="px-5 py-3.5 border-b border-zinc-100 bg-zinc-50/50 flex justify-between items-center select-none">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Bill Entry Table</span>
                <button type="button" onClick={appendRowItem} className="text-xs font-bold text-zinc-900 bg-white border border-zinc-200 px-2.5 py-1 rounded-lg hover:bg-zinc-50 cursor-pointer shadow-3xs">+ Append Row Item</button>
              </div>
              <div className="overflow-x-visible">
                <table className="w-full text-left text-xs font-medium border-collapse">
                  <thead>
                    <tr className="bg-zinc-50/70 border-b border-zinc-200 font-bold uppercase tracking-wider text-zinc-400 select-none">
                      <th className="px-4 py-2.5">Product Allocation Reference</th>
                      <th className="px-4 py-2.5 w-28 text-center">Billing Unit</th>
                      <th className="px-4 py-2.5 w-20 text-right">Qty</th>
                      <th className="px-4 py-2.5 w-24 text-right">Rate</th>
                      <th className="px-4 py-2.5 w-24 text-right">Row Net</th>
                      <th className="px-4 py-2.5 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {billingCalculations.items.map((row) => {
                      const associatedProduct = products.find(p => p._id === row.product);
                      const displayCartonSelector = associatedProduct && associatedProduct.packagingType === 'cartoon';

                      return (
                        <tr key={row.id} className={`transition-colors duration-150 ${row.isInvalid ? 'bg-red-50/60' : 'hover:bg-zinc-50/20'}`}>

                          {/* 💡 BULLETPROOF COMBOBOX: Searchable without absolute positioning issues */}
                          <td className="px-4 py-3">
                            <div className="w-full">
                              {/* Native HTML Datalist provides auto-filtering search right out of the box */}
                              <input
                                list={`products-datalist-${row.id}`}
                                placeholder="Search product SKU or Name..."
                                value={row.searchFilter || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  modifyRowField(row.id, 'searchFilter', val);

                                  // Match selection by SKU or formatting template label text strings
                                  const match = products.find(p =>
                                    p.sku === val ||
                                    `${p.sku} - ${p.name}`.toLowerCase() === val.toLowerCase()
                                  );
                                  if (match) {
                                    modifyRowField(row.id, 'product', match._id);
                                  }
                                }}
                                className="w-full rounded-lg border border-zinc-200 p-1.5 bg-white text-xs font-medium focus:outline-none focus:border-zinc-400"
                              />

                              <datalist id={`products-datalist-${row.id}`}>
                                {products.map(p => (
                                  <option
                                    key={p._id}
                                    value={`${p.sku} - ${p.name}`}
                                  >
                                    {p.packagingType === 'cartoon' ? `${p.cartoonCount} Ctn / ${p.stockQuantity} Pcs left` : `${p.stockQuantity} Pcs left`}
                                  </option>
                                ))}
                              </datalist>
                            </div>

                            {row.isInvalid && (
                              <p className="mt-1 text-[11px] font-bold text-red-600 animate-pulse">
                                ⚠️ Stock Over-limit! Total added ({row.totalPooledSelected} Pcs) exceeds available stock ({row.availableStockLabel}).
                              </p>
                            )}
                          </td>

                          <td className="px-4 py-3 text-center">
                            <select
                              disabled={!displayCartonSelector}
                              value={row.unitType}
                              onChange={(e) => modifyRowField(row.id, 'unitType', e.target.value)}
                              className="w-full rounded-lg border border-zinc-200 p-1 bg-white font-semibold text-[11px] text-zinc-700 disabled:opacity-55 focus:outline-hidden"
                            >
                              <option value="piece">Pieces (Pcs)</option>
                              {displayCartonSelector && <option value="cartoon">Cartons (Ctn)</option>}
                            </select>
                          </td>

                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="1"
                              value={row.quantity === '' ? '' : row.quantity}
                              onChange={(e) => {
                                const inputValue = e.target.value;
                                if (inputValue === '') {
                                  modifyRowField(row.id, 'quantity', '');
                                } else {
                                  const parsedValue = parseInt(inputValue, 10);
                                  modifyRowField(row.id, 'quantity', Math.max(1, isNaN(parsedValue) ? 1 : parsedValue));
                                }
                              }}
                              className="w-full text-right rounded-lg border border-zinc-200 p-1 bg-white focus:outline-none font-mono"
                            />
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-zinc-600">
                            ₹{row.pricePerUnit.toFixed(2)}
                            {row.unitType === 'cartoon' && associatedProduct && (
                              <span className="block text-[9px] text-zinc-400 font-normal">
                                (×{associatedProduct.piecesPerCartoon} Pcs)
                              </span>
                            )}
                          </td>
                          <td className={`px-4 py-3 text-right font-bold font-mono ${row.rowTotal < 0 ? 'text-red-600' : 'text-zinc-900'}`}>₹{row.rowTotal.toFixed(2)}</td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => clearRowItem(row.id)}
                              disabled={invoiceItems.length === 1}
                              className="text-zinc-300 hover:text-red-600 disabled:opacity-20 transition font-bold cursor-pointer"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="bg-white border border-zinc-200 p-5 rounded-xl shadow-2xs space-y-4 sticky top-20">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 pb-2 select-none">Checkout Aggregates</span>

            {transactionMode === 'sale' ? (
              <>
                <div className="space-y-3.5 border-b border-zinc-100 pb-4">
                  <div className="flex justify-between font-bold text-zinc-600 text-xs"><span>Subtotal</span><span className="font-bold font-mono text-zinc-900">₹{billingCalculations.subTotal.toFixed(2)}</span></div>
                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-1 font-bold uppercase tracking-wider select-none">Tax (₹)</label>
                    <input type="number" min="0" value={taxAmount} placeholder="0" onChange={(e) => handleNumericInputClearance(e.target.value, setTaxAmount)} className="w-full text-right rounded-xl border border-zinc-200 px-3 py-1 font-mono text-xs" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-red-500 mb-1 font-bold uppercase tracking-wider select-none">Discount (₹)</label>
                    <input type="number" min="0" value={discountAmount} placeholder="0" onChange={(e) => handleNumericInputClearance(e.target.value, setDiscountAmount)} className="w-full text-right rounded-xl border border-red-200 bg-red-50/10 text-red-700 font-mono text-xs px-3 py-1" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-1 font-bold uppercase tracking-wider select-none">Settlement Parameters</label>
                    <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className="w-full text-xs rounded-xl border border-zinc-200 px-2.5 py-1 bg-white font-semibold">
                      <option value="Paid">Paid / Settled Document</option>
                      <option value="Pending">Pending / Accrual Credit</option>
                      <option value="Partial">Partial Payment</option>
                    </select>
                  </div>
                  {paymentStatus === 'Partial' && (
                    <div className="p-2.5 border border-amber-200 bg-amber-50/10 rounded-xl space-y-1.5 animate-fadeIn">
                      <label className="block text-[10px] text-amber-700 font-black uppercase tracking-wider">Upfront Collected Amount (₹)</label>
                      <input type="number" min="0" placeholder="0" value={partialAmount} onChange={(e) => handleNumericInputClearance(e.target.value, setPartialAmount)} className="w-full text-right border border-amber-300 rounded-xl px-3 py-1 font-mono text-xs text-amber-900 bg-white" />
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-xs font-bold text-zinc-900 select-none uppercase tracking-wide">Grand Total</span>
                  <span className="text-xl font-black font-mono tracking-tight text-zinc-950">₹{billingCalculations.grandTotal.toFixed(2)}</span>
                </div>
              </>
            ) : (
              <div className="p-4 border border-red-200 bg-red-50/40 rounded-xl space-y-2 text-center select-none">
                <span className="block text-[10px] font-black text-red-700 tracking-widest uppercase">Total Customer Return Credit</span>
                <span className="block font-mono text-xl font-black text-red-700">₹{billingCalculations.totalReturnsCredit.toFixed(2)}</span>
              </div>
            )}

            <button type="button" disabled={billingCalculations.isBlocked || isSubmitting} onClick={executeInvoiceCompilation} className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-100 disabled:text-zinc-400 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition duration-150 cursor-pointer select-none">
              {isSubmitting ? 'Processing...' : transactionMode === 'return' ? 'Log Return Statement' : 'Generate Bill'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;