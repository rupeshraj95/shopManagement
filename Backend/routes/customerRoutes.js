// const express = require('express');
// const router = express.Router();
// const { createCustomer, getCustomers } = require('../controllers/customerController');

// // Mounted on /api/customers in server.js
// router.get('/', getCustomers);
// router.post('/', createCustomer);

// module.exports = router;

const express = require('express');
const router = express.Router();
const { createCustomer, getCustomers, updateCustomer, deleteCustomer } = require('../controllers/customerController');

router.get('/', getCustomers);
router.post('/', createCustomer);
router.put('/:id', updateCustomer);    // 💡 Added PUT route hook mapping
router.delete('/:id', deleteCustomer); // 💡 Added DELETE route hook mapping

module.exports = router;