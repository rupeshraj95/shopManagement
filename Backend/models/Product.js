const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category reference is required'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    packagingType: {
      type: String,
      required: [true, 'Packaging type tracking selection is required'],
      enum: {
        values: ['piece', 'cartoon'],
        message: 'Packaging type must be either piece or cartoon'
      },
      default: 'piece',
    },
    cartoonCount: {
      type: Number,
      min: [0, 'Carton inventory balance counts cannot be negative'],
      default: 0,
    },
    piecesPerCartoon: {
      type: Number,
      min: [0, 'Pieces per bundle metrics parameters cannot be negative'],
      default: 0,
    },
    individualPieces: {
      type: Number,
      min: [0, 'Individual loose single pieces volume counts cannot be negative'],
      default: 0,
    },
    stockQuantity: {
      type: Number,
      required: [true, 'Stock quantity tracking parameter is required'],
      min: [0, 'Stock volume balances cannot be negative'],
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);
// 💡 IMMUNE TO VERSION ERROS: Handled as an async function with NO next parameter
productSchema.pre('save', async function () {
  const pcsPerCtn = Number(this.piecesPerCartoon) || 0;

  if (this.packagingType === 'cartoon' && pcsPerCtn > 0) {
    const currentStock = Number(this.stockQuantity) || 0;
    const currentCartons = Number(this.cartoonCount) || 0;
    const currentLoose = Number(this.individualPieces) || 0;

    // Check what the composite multiplier sum evaluates to in memory
    const formulaSum = (currentCartons * pcsPerCtn) + currentLoose;

    // ⚡ Case A: If total pieces count was updated during a loose unit checkout or out of sync
    if (currentStock !== formulaSum) {
      this.cartoonCount = Math.floor(currentStock / pcsPerCtn);
      this.individualPieces = currentStock % pcsPerCtn;
    } 
    // ⚡ Case B: If cartons or loose entries were manual entry adjustments via standard forms
    else {
      this.stockQuantity = formulaSum;
      this.cartoonCount = Math.floor(formulaSum / pcsPerCtn);
      this.individualPieces = formulaSum % pcsPerCtn;
    }
  } else if (this.packagingType === 'piece') {
    this.cartoonCount = 0;
    this.piecesPerCartoon = 0;
    this.individualPieces = 0;
  }
});

module.exports = mongoose.model('Product', productSchema);