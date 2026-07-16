const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none', 
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path:'/'
    });
  
    res.status(200).json({ _id: user._id, name: user.name, email: user.email });
  } catch (error) {
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

const logoutUser = async (req, res) => {
  try {
    res.cookie('token', '', { httpOnly: true, secure: true, sameSite: 'none' ,path:'/'});
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error during logout', error: error.message });
  }
};

// 💡 ADDED: Missing getMe handler to resolve your frontend context verification check hook loop safely
const getMe = async (req, res) => {
  try {
    const token = req.cookies.token;
    // 💡 FIXED: Return standard HTTP 401 Unauthorized status so your frontend hooks catch it
    if (!token) return res.status(401).json({ message: 'No token provided' }); 

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(200).json(null);

    res.status(200).json(user);
  } catch (error) {
    // 💡 FIXED: Stop letting invalid/expired tokens slip through with HTTP 200 statuses
    res.status(401).json({ message: 'Invalid token signature' });
  }
};

// 💡 FIXED: Mapped keys align with routes destructuring rules perfectly
module.exports = { loginUser, logoutUser, getMe };