const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please login.' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'epitome_secret_jwt_key_123');

    // Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({ success: false, message: 'The user belonging to this token no longer exists.' });
    }

    if (currentUser.status === 'BLOCKED') {
      return res.status(403).json({ success: false, message: 'Your account has been suspended/blocked.' });
    }

    // Grant access
    req.user = currentUser;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired.', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token. Please login again.' });
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action.',
      });
    }
    next();
  };
};

module.exports = {
  protect,
  restrictTo,
};
