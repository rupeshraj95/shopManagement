const Product = require('../models/Product');
const Category = require('../models/Category');

// @desc    Create a new product category
// @route   POST /api/products/category
// @access  Private
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

// @desc    Get all product categories
// @route   GET /api/products/category
// @access  Private
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching categories.', error: error.message });
  }
};

// @desc    Create a new product
// @route   POST /api/products
// @access  Private
const createProduct = async (req, res) => {
  try {
    const { name, sku, category, price, stockQuantity } = req.body;
    const skuExists = await Product.findOne({ sku });
    if (skuExists) return res.status(400).json({ message: 'A product with this SKU already exists.' });

    const product = new Product({ name, sku, category, price, stockQuantity });
    const savedProduct = await product.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    res.status(500).json({ message: 'Server error creating product.', error: error.message });
  }
};

// @desc    Get all products
// @route   GET /api/products
// @access  Private
const getProducts = async (req, res) => {
  try {
    const products = await Product.find().populate('category', 'name');
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching products.', error: error.message });
  }
};

// @desc    Update an existing product profile
// @route   PUT /api/products/:id
// @access  Private
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, sku, category, price, stockQuantity } = req.body;

    if (!name?.trim() || !sku?.trim() || !category) {
      return res.status(400).json({ message: 'Name, SKU code, and Category allocation are required fields.' });
    }

    if (Number(price) <= 0 || Number(stockQuantity) < 0) {
      return res.status(400).json({ message: 'Price rate must be above $0 and stock balance cannot be negative.' });
    }

    const duplicateSkuItem = await Product.findOne({ sku, _id: { $ne: id } });
    if (duplicateSkuItem) {
      return res.status(400).json({ message: 'Another product inventory line item is already tracking this SKU code.' });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        name: name.trim(),
        sku: sku.trim(),
        category,
        price: Number(price),
        stockQuantity: Number(stockQuantity)
      },
      { new: true, runValidators: true }
    ).populate('category', 'name');

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product asset profile row could not be found.' });
    }

    res.status(200).json({ message: 'Product parameters adjusted successfully.', product: updatedProduct });
  } catch (error) {
    res.status(500).json({ message: 'Server error modifying product data.', error: error.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedProduct = await Product.findByIdAndDelete(id);
    if (!deletedProduct) {
      return res.status(404).json({ message: 'Target product profile record not found.' });
    }

    res.status(200).json({ message: 'Product profile removed successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting product parameters.', error: error.message });
  }
};

// @desc    Update a product category
// @route   PUT /api/products/category/:id
// @access  Private
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name?.trim()) return res.status(400).json({ message: 'Category name is required.' });

    const duplicateCheck = await Category.findOne({ name, _id: { $ne: id } });
    if (duplicateCheck) return res.status(400).json({ message: 'Another category already runs this name.' });

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      { name: name.trim(), description },
      { new: true, runValidators: true }
    );

    if (!updatedCategory) return res.status(404).json({ message: 'Category record index not found.' });
    res.status(200).json(updatedCategory);
  } catch (error) {
    res.status(500).json({ message: 'Server error updating category.', error: error.message });
  }
};

// @desc    Delete a product category
// @route   DELETE /api/products/category/:id
// @access  Private
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const attachedProductsCount = await Product.countDocuments({ category: id });
    if (attachedProductsCount > 0) {
      return res.status(400).json({ 
        message: `Cannot clear this category record index. There are ${attachedProductsCount} active products assigned directly to it.` 
      });
    }

    const deletedCategory = await Category.findByIdAndDelete(id);
    if (!deletedCategory) return res.status(404).json({ message: 'Category index not found.' });

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