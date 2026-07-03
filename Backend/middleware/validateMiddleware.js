const isEmpty = (value) => value === undefined || value === null || String(value).trim() === '';
const isPositiveNumber = (value) => typeof value === 'number' && !isNaN(value) && value >= 0;

// Updated regex specifically for Indian mobile number system
const isValidPhone = (phone) => {
  // Cleans out spaces, hyphens, and parentheses first
  const cleanPhone = String(phone).replace(/[\s()-]/g, '');
  
  /**
   * Indian Mobile Regex breakdown:
   * ^(?:\+91|91|0)? -> Optional prefix: +91, 91, or 0
   * [6-9]           -> Indian mobile numbers always start with 6, 7, 8, or 9
   * \d{9}$          -> Followed by exactly 9 more digits (making it a total of 10 digits)
   */
  const indianPhoneRegex = /^(?:\+91|91|0)?[6-9]\d{9}$/; 
  return indianPhoneRegex.test(cleanPhone);
};

const validateProduct = (req, res, next) => {
  const { name, sku, category, price, stockQuantity } = req.body;
  const errors = {};

  if (isEmpty(name)) errors.name = 'Product name is required';
  if (isEmpty(sku)) errors.sku = 'SKU is required';
  if (isEmpty(category)) errors.category = 'Category ID reference is required';
  
  const parsedPrice = Number(price);
  if (isEmpty(price) || !isPositiveNumber(parsedPrice)) errors.price = 'Price must be a positive number';

  const parsedStock = Number(stockQuantity);
  if (isEmpty(stockQuantity) || !isPositiveNumber(parsedStock)) errors.stockQuantity = 'Stock must be a positive number';

  if (Object.keys(errors).length > 0) return res.status(400).json({ message: 'Validation Failed', errors });

  req.body.price = parsedPrice;
  req.body.stockQuantity = parsedStock;
  next();
};

const validateCustomer = (req, res, next) => {
  const { name, phone, email } = req.body;
  const errors = {};

  if (isEmpty(name)) errors.name = 'Customer name is required';
  if (isEmpty(phone)) {
    errors.phone = 'Phone number is required';
  } else if (!isValidPhone(phone)) {
    errors.phone = 'Invalid Indian phone number format. Use 10 digits (e.g., 9876543210 or +919876543210)';
  }

  if (!isEmpty(email)) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(email).toLowerCase())) errors.email = 'Email format is invalid';
  }

  if (Object.keys(errors).length > 0) return res.status(400).json({ message: 'Validation Failed', errors });
  next();
};

module.exports = { validateProduct, validateCustomer };