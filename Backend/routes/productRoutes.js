const express = require('express');
const router = express.Router();
const { 
  getProducts, 
  createProduct, 
  getCategories, 
  createCategory, 
  updateProduct,
  deleteProduct,
  updateCategory,
  deleteCategory 
} = require('../controllers/productController');

// Product Endpoint Hooks
router.get('/', getProducts);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

// Category Endpoint Hooks
router.get('/category', getCategories);
router.post('/category', createCategory);
router.put('/category/:id', updateCategory);
router.delete('/category/:id', deleteCategory);

module.exports = router;