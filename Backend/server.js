const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const path = require('path');
const cors = require('cors');
const connectDB = require('./config/db.js');

const authRoutes = require('./routes/authRoutes.js');
const productRoutes = require('./routes/productRoutes.js');
const customerRoutes = require('./routes/customerRoutes.js');
const invoiceRoutes = require('./routes/invoiceRoutes.js');

dotenv.config();
const app = express();
connectDB();

const allowedOrigins = [
  'https://abhishek-trading.onrender.com' || 'http://localhost:5173'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // Allow server/testing suits requests safely
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error('CORS block structure mismatch.'), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

// const allowedOrigins = [
//   'https://abhishek-trading.onrender.com',     // Your current live frontend URL\
//   'http://localhost:5173'                    // Your local testing environment
// ];

// app.use(cors({
//   origin: function (origin, callback) {
//     // Allow requests with no origin (like mobile apps or curl requests)
//     if (!origin) return callback(null, true);
    
//     if (allowedOrigins.indexOf(origin) === -1) {
//       return callback(new Error('CORS block structure mismatch.'), false);
//     }
//     return callback(null, true);
//   },
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// }));
app.use(express.json());
app.use(cookieParser());


// Core Institutional Mounting Parameters
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/invoices', invoiceRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`POS Server running on port: ${PORT}`));