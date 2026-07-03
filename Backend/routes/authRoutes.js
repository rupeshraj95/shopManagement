const express = require('express');
const router = express.Router();

// 💡 PERFECT ALIGNMENT: Destructuring matches your controller exports exactly
const { loginUser, logoutUser, getMe } = require('../controllers/authController');

// All handlers map directly to active, imported functions
router.post('/login', loginUser);   
router.post('/logout', logoutUser);
router.get('/me', getMe);

module.exports = router;