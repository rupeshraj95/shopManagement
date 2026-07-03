const mongoose = require('mongoose');

/**
 * Establishes a connection to the MongoDB database cluster.
 * Terminates process execution immediately if a critical connection failure occurs.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    
    console.log(`MongoDB Connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database Connection Error: ${error.message}`);
    // Exit application with failure code (1) to trigger container/server restarts
    process.exit(1);
  }
};

module.exports = connectDB;