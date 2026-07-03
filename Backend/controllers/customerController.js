// const Customer = require('../models/Customer');

// const createCustomer = async (req, res) => {
//   try {
//     const { name, phone, email, address } = req.body;
//     const existingCustomer = await Customer.findOne({ phone });
//     if (existingCustomer) return res.status(400).json({ message: 'Customer phone already exists.' });

//     const customer = new Customer({ name, phone, email, address });
//     const savedCustomer = await customer.save();
//     res.status(201).json(savedCustomer);
//   } catch (error) {
//     res.status(500).json({ message: 'Server error creating customer.', error: error.message });
//   }
// };

// const getCustomers = async (req, res) => {
//   try {
//     const customers = await Customer.find();
//     res.status(200).json(customers);
//   } catch (error) {
//     res.status(500).json({ message: 'Server error fetching customers.', error: error.message });
//   }
// };

// module.exports = { createCustomer, getCustomers };

const Customer = require('../models/Customer');
const Invoice = require('../models/Invoice'); // 💡 Added to safeguard dependency lookups

// @desc    Create a new customer
// @route   POST /api/customers
const createCustomer = async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;
    const existingCustomer = await Customer.findOne({ phone });
    if (existingCustomer) return res.status(400).json({ message: 'Customer phone already exists.' });

    const customer = new Customer({ name, phone, email, address });
    const savedCustomer = await customer.save();
    res.status(201).json(savedCustomer);
  } catch (error) {
    res.status(500).json({ message: 'Server error creating customer.', error: error.message });
  }
};

// @desc    Get all customers
// @route   GET /api/customers
const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find();
    res.status(200).json(customers);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching customers.', error: error.message });
  }
};

// 💡 NEW CONTROLLER: Update an existing customer profile row
// @desc    Update customer profile details
// @route   PUT /api/customers/:id
const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, address } = req.body;

    if (!name?.trim() || !phone?.trim()) {
      return res.status(400).json({ message: 'Name and phone mapping designations are required fields.' });
    }

    // Check for phone duplicate blocks excluding the current document resource target
    const duplicatePhone = await Customer.findOne({ phone, _id: { $ne: id } });
    if (duplicatePhone) {
      return res.status(400).json({ message: 'Another client record is already tracking this phone number.' });
    }

    const updatedCustomer = await Customer.findByIdAndUpdate(
      id,
      { name: name.trim(), phone: phone.trim(), email: email.trim(), address },
      { new: true, runValidators: true }
    );

    if (!updatedCustomer) return res.status(404).json({ message: 'Customer profile record trace failed.' });
    res.status(200).json(updatedCustomer);
  } catch (error) {
    res.status(500).json({ message: 'Server error updating customer details.', error: error.message });
  }
};

// 💡 NEW CONTROLLER: Delete customer if clear of active transaction items
// @desc    Delete customer profile reference
// @route   DELETE /api/customers/:id
const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if customer possesses historical or pending credit lines before purging
    const attachedInvoicesCount = await Invoice.countDocuments({ customer: id });
    if (attachedInvoicesCount > 0) {
      return res.status(400).json({ 
        message: `Wipe rejected. There are ${attachedInvoicesCount} historical invoices tracking parameters linked to this account ledger.` 
      });
    }

    const deletedCustomer = await Customer.findByIdAndDelete(id);
    if (!deletedCustomer) return res.status(404).json({ message: 'Customer profile sequence index not found.' });

    res.status(200).json({ message: 'Customer profile index cleared successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting customer profile row.', error: error.message });
  }
};

module.exports = { createCustomer, getCustomers, updateCustomer, deleteCustomer };