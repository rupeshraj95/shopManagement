const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    // 💡 UPDATED: Removed min: 1 constraint to let users backspace inputs completely while typing
    quantity: { type: Number, required: true }, 
    pricePerUnit: { type: Number, required: true },
    status: { type: String, enum: ['included', 'returned'], default: 'included' },
    rowTotal: { type: Number, required: true }
  }],
  
  subTotal: { type: Number, required: true },
  taxAmount: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },
  amountPaid: { type: Number, required: true, default: 0 },
  paymentStatus: { type: String, enum: ['Paid', 'Pending', 'Partial'], default: 'Paid' },
  
  partialPayments: [{
    amountCollected: { type: Number, required: true },
    collectedAt: { type: Date, default: Date.now }
  }],

  // 💡 ADDED: Explicit tracking array recording structural return credits over time
  returnedHistory: [{
    returnedAmount: { type: Number, required: true },
    returnedAt: { type: Date, default: Date.now },
    notes: { type: String }
  }],
  
  digitalSignature: { type: String, default: "ABHISHEK_TRADING_TERMINAL_SIGN" }
}, { timestamps: true });

module.exports = mongoose.model('Invoice', InvoiceSchema);