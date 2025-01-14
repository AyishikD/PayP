// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
async function authenticate(req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', ''); 

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify the token
    req.user = decoded; // Attach decoded user info to the request object
    next(); // Allow the request to proceed to the next middleware or route handler
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Invalid token' });
  }
}

module.exports = authenticate;
