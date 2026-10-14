const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
function authenticate(req, res, next) {
  const [scheme, token] = (req.get('Authorization') || '').split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    // Tokens issued before expiry was introduced have no `exp` and would never expire, so reject them.
    if (!Number.isInteger(decoded.userId) || !decoded.exp) {
      throw new Error('Malformed token payload');
    }
    req.user = { userId: decoded.userId };
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

module.exports = authenticate;
