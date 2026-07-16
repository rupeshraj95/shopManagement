const Product = require('../models/Product');
const Category = require('../models/Category');

// Helper function to auto-balance loose items into cartons cleanly
const autoBalanceCartonStock = (cartons, pcsPerCtn, loosePcs) => {
  let finalCartons = Number(cartons) || 0;
  let finalLoose = Number(loosePcs) || 0;
  const multiplier = Number(pcsPerCtn) || 0;

  if (multiplier > 0 && finalLoose >= multiplier) {
    const newlyCreatedBoxes = Math.floor(finalLoose / multiplier);
    finalCartons += newlyCreatedBoxes;
    finalLoose = finalLoose % multiplier;
  }

  return {
    cartoonCount: finalCartons,
    individualPieces: finalLoose,
    stockQuantity: (finalCartons * multiplier) + finalLoose
  };
};

// @desc     Create a new product category
// @route    POST /api/products/category
// @access   Private
const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Category name is required.' });

    const categoryExists = await Category.findOne({ name });
    if (categoryExists) return res.status(400).json({ message: 'Category already exists.' });

    const category = new Category({ name, description });
    const savedCategory = await category.save();
    res.status(201).json(savedCategory);
  } catch (error) {
    res.status(500).json({ message: 'Server error creating category.', error: error.message });
  }
};

// @desc     Get all product categories
// @route    GET /api/products/category
// @access   Private
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching categories.', error: error.message });
  }
};

// @desc     Create a new product with absolute auto-balancing math rules
// @route    POST /api/products
// @access   Private
const createProduct = async (req, res) => {
  try {
    const { name, sku, category, price, packagingType, cartoonCount, piecesPerCartoon, individualPieces, stockQuantity } = req.body;
    
    if (!name?.trim() || !sku?.trim() || !category) {
      return res.status(400).json({ message: 'Name, SKU code, and Category allocation are required fields.' });
    }

    const skuExists = await Product.findOne({ sku: sku.trim() });
    if (skuExists) return res.status(400).json({ message: 'A product with this SKU already exists.' });

    let finalData = {
      name: name.trim(),
      sku: sku.trim(),
      category,
      price: Number(price) || 0,
      packagingType: packagingType || 'piece',
      cartoonCount: 0,
      piecesPerCartoon: 0,
      individualPieces: 0,
      stockQuantity: 0
    };

    if (finalData.packagingType === 'cartoon') {
      const balanced = autoBalanceCartonStock(cartoonCount, piecesPerCartoon, individualPieces);
      finalData.cartoonCount = balanced.cartoonCount;
      finalData.piecesPerCartoon = Number(piecesPerCartoon) || 0;
      finalData.individualPieces = balanced.individualPieces;
      finalData.stockQuantity = balanced.stockQuantity;
    } else {
      finalData.stockQuantity = Number(stockQuantity) || 0;
    }

    const product = new Product(finalData);
    const savedProduct = await product.save();
    
    const fullyPopulatedDoc = await Product.findById(savedProduct._id).populate('category', 'name');
    res.status(201).json(fullyPopulatedDoc);
  } catch (error) {
    res.status(500).json({ message: 'Server error creating product.', error: error.message });
  }
};

// @desc     Get all products
// @route    GET /api/products
// @access   Private
const getProducts = async (req, res) => {
  try {
    const products = await Product.find().populate('category', 'name');
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching products.', error: error.message });
  }
};

// @desc     Update an existing product intelligently (Locks Packaging Type but opens loose pieces options)
// @route    PUT /api/products/:id
// @access   Private
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, sku, category, price, cartoonCount, piecesPerCartoon, individualPieces, stockQuantity, stockEditMode } = req.body;

    if (!name?.trim() || !sku?.trim() || !category) {
      return res.status(400).json({ message: 'Name, SKU code, and Category allocation are required fields.' });
    }

    const currentProduct = await Product.findById(id);
    if (!currentProduct) {
      return res.status(404).json({ message: 'Product asset profile row could not be found.' });
    }

    const duplicateSkuItem = await Product.findOne({ sku, _id: { $ne: id } });
    if (duplicateSkuItem) {
      return res.status(400).json({ message: 'Another product inventory line item is already tracking this SKU code.' });
    }

    currentProduct.name = name.trim();
    currentProduct.sku = sku.trim();
    currentProduct.category = category;
    currentProduct.price = Number(price) || 0;

    const existingCartons = Number(currentProduct.cartoonCount) || 0;
    const existingPiecesPerCartoon = Number(currentProduct.piecesPerCartoon) || 0;
    const existingIndividualPieces = Number(currentProduct.individualPieces) || 0;
    const existingStockQuantity = Number(currentProduct.stockQuantity) || 0;

    if (currentProduct.packagingType === 'cartoon') {
      const inputCartons = Number(cartoonCount) || 0;
      const inputPcsPerCtn = Number(piecesPerCartoon) || 0;
      const inputLoosePieces = Number(individualPieces) || 0;

      // Lock configuration parameters multiplier limits safely
      currentProduct.piecesPerCartoon = inputPcsPerCtn > 0 ? inputPcsPerCtn : existingPiecesPerCartoon;

      let targetCartonsCount = 0;
      let targetLoosePiecesCount = 0;

      if (stockEditMode === 'add') {
        // ➕ OPTION A: INCREMENTAL APPEND VALUES STRATEGY
        targetCartonsCount = existingCartons + inputCartons;
        targetLoosePiecesCount = existingIndividualPieces + inputLoosePieces;
      } else {
        // ✏️ OPTION B: ABSOLUTE CHANGE OVERWRITE VALUES STRATEGY
        targetCartonsCount = inputCartons;
        targetLoosePiecesCount = inputLoosePieces;
      }

      // Run math compilation through the auto-balancing calculation engine
      const balanced = autoBalanceCartonStock(targetCartonsCount, currentProduct.piecesPerCartoon, targetLoosePiecesCount);
      
      currentProduct.cartoonCount = balanced.cartoonCount;
      currentProduct.individualPieces = balanced.individualPieces;
      currentProduct.stockQuantity = balanced.stockQuantity;

      if (currentProduct.cartoonCount < 0 || currentProduct.individualPieces < 0) {
        return res.status(400).json({ message: 'Inventory balances cannot evaluate to negative parameters.' });
      }

    } else {
      // Piece Tracking update logic path
      const inputStock = Number(stockQuantity) || 0;
      if (stockEditMode === 'add') {
        currentProduct.stockQuantity = existingStockQuantity + inputStock;
      } else {
        currentProduct.stockQuantity = inputStock;
      }

      if (currentProduct.stockQuantity < 0) {
        return res.status(400).json({ message: 'Stock piece volume balance cannot be negative.' });
      }

      currentProduct.cartoonCount = 0;
      currentProduct.piecesPerCartoon = 0;
      currentProduct.individualPieces = 0;
    }

    if (currentProduct.price <= 0) {
      return res.status(400).json({ message: 'Price rate must be above ₹0.' });
    }

    currentProduct.markModified('cartoonCount');
    currentProduct.markModified('piecesPerCartoon');
    currentProduct.markModified('individualPieces');
    currentProduct.markModified('stockQuantity');

    await currentProduct.save();

    const fullyPopulatedDoc = await Product.findById(id).populate('category', 'name');
    res.status(200).json(fullyPopulatedDoc);
    
  } catch (error) {
    res.status(500).json({ message: 'Server error modifying product data.', error: error.message });
  }
};

// @desc     Delete a product
// @route    DELETE /api/products/:id
// @access   Private
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedProduct = await Product.findByIdAndDelete(id);
    if (!deletedProduct) return res.status(404).json({ message: 'Target product not found.' });
    res.status(200).json({ message: 'Product profile removed successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting product parameters.', error: error.message });
  }
};

// @desc     Update a product category
// @route    PUT /api/products/category/:id
// @access   Private
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Category name is required.' });

    const duplicateCheck = await Category.findOne({ name, _id: { $ne: id } });
    if (duplicateCheck) return res.status(400).json({ message: 'Another category already runs this name.' });

    const updatedCategory = await Category.findByIdAndUpdate(id, { name: name.trim(), description }, { new: true });
    if (!updatedCategory) return res.status(404).json({ message: 'Category not found.' });
    res.status(200).json(updatedCategory);
  } catch (error) {
    res.status(500).json({ message: 'Server error updating category.', error: error.message });
  }
};

// @desc     Delete a product category
// @route    DELETE /api/products/category/:id
// @access   Private
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const attachedProductsCount = await Product.countDocuments({ category: id });
    if (attachedProductsCount > 0) {
      return res.status(400).json({ message: `Cannot delete category. ${attachedProductsCount} active products are linked.` });
    }
    const deletedCategory = await Category.findByIdAndDelete(id);
    if (!deletedCategory) return res.status(404).json({ message: 'Category not found.' });
    res.status(200).json({ message: 'Category eliminated from system records.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting category.', error: error.message });
  }
};

module.exports = { 
  createCategory, 
  getCategories, 
  createProduct, 
  getProducts,
  updateProduct,
  deleteProduct,
  updateCategory,
  deleteCategory
};