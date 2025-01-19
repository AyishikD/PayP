const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet'); 
const sequelize = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const { logger } = require('./utils/logger');
const healthCheck = require('./routes/healthCheck');
const errorHandler = require('./middleware/errorHandler');
const rateLimit = require('express-rate-limit');

const app = express();
const port = 3000;

const swaggerUi = require('swagger-ui-express');
const swaggerDocs = require('./swagger');



// Set up rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 50,                  // Allow each IP 50 requests per 15 minutes
  message: 'Too many requests from this IP, please try again later.',
  headers: true,             // Include rate limit headers in the response
});

// Apply rate limiting globally
app.use(limiter);

// Set security headers with Helmet
app.use(helmet()); // Apply default Helmet security headers


app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Customize Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      },
    },
    crossOriginEmbedderPolicy: true,
    crossOriginResourcePolicy: { policy: 'same-origin' }, // Restrict resource sharing
  })
);

// Enable CORS
app.use(cors());

// Body parsers
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware for logging requests
app.use((req, res, next) => {
  logger.info(`Incoming request: ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api', healthCheck); // Health check route
app.use('/api/auth', authRoutes); 
app.use('/api/payment', paymentRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('Payment Platform API is running!');
});

// Global error handler
app.use(errorHandler);

// Sync database and start the server
sequelize.sync()
  .then(() => {
    app.listen(port, () => {
      logger.info(`Server is running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('Error syncing database:', error);
    logger.error('Error syncing database:', error.message);
  });
