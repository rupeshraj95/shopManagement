
// const express = require('express');
// const router = express.Router();
// const { createInvoice, getInvoices, updateInvoiceStatus } = require('../controllers/invoiceController');

// // 💡 1. Import your auth protection middleware
// const { protect } = require('../middleware/authMiddleware'); 

// router.post('/', createInvoice);
// router.get('/', getInvoices);

// // 💡 2. Add 'protect' directly in front of your update status controller
// router.put('/:id', protect, updateInvoiceStatus);

// module.exports = router;

const express = require('express');
const router = express.Router();
const { createInvoice, getInvoices, updateInvoiceStatus } = require('../controllers/invoiceController');

// 💡 IMPORT CORRECTLY: Use destructuring brackets to match the middleware file export
const { protect } = require('../middleware/authMiddleware');

router.post('/', createInvoice);
router.get('/', getInvoices);

// 💡 Use it cleanly right here as a callback sequence argument parameter
router.put('/:id', protect, updateInvoiceStatus);

module.exports = router;