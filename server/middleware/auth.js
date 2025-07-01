const jwt = require('jsonwebtoken');

/**
 * Authentication middleware to verify JWT tokens
 * Extracts token from Authorization header and verifies it
 */
module.exports = function (req, res, next) {
  console.log('Auth middleware:', req.method, req.originalUrl, req.headers.authorization);
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Expecting 'Bearer <token>'
  if (!token) {
    return res.status(401).json({ error: 'No token, authorization denied' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { userId: decoded.userId };
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token is not valid' });
  }
}; 