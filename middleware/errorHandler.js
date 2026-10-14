const { logger } = require('../utils/logger');

// Error handling middleware. Client errors keep their message; server errors are logged and hidden.
function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;

  if (status >= 500) {
    logger.error(`${req.method} ${req.originalUrl} failed: ${err.stack || err.message}`);
  }

  if (res.headersSent) {
    return next(err);
  }

  res.status(status).json({
    message: status >= 500 ? 'Internal Server Error' : err.message,
  });
}

module.exports = errorHandler;
