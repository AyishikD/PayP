const winston = require('winston');

// Create a custom logger
const logger = winston.createLogger({
  level: 'info', // Default level
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple()
  ),
  transports: [
    new winston.transports.Console({ format: winston.format.simple() })
  ]
});

module.exports = { logger };
