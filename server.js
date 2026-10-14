require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const sequelize = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const autopayRoutes = require('./routes/autopayRoutes');
const healthCheck = require('./routes/healthCheck');
const errorHandler = require('./middleware/errorHandler');
const swaggerDocs = require('./swagger');
const { logger } = require('./utils/logger');
const { startAutopayCron } = require('./utils/autopayCron');

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not set.');
}

const app = express();
const port = Number(process.env.PORT) || 3000;

// Number of reverse proxies in front of the app (e.g. 1 on Render), so rate limiting sees real client IPs.
app.set('trust proxy', Number(process.env.TRUST_PROXY) || 0);

// Set up rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: Number(process.env.RATE_LIMIT_MAX) || 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many requests from this IP, please try again later.' },
});

// Apply rate limiting globally
app.use(limiter);

// Set security headers with Helmet
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
    crossOriginResourcePolicy: { policy: 'same-origin' },
  })
);

// Enable CORS
app.use(cors());

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware for logging requests
app.use((req, res, next) => {
  logger.info(`Incoming request: ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api', healthCheck);
app.use('/api/auth', authRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/mandate', autopayRoutes);

// Swagger API Docs route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Root route
app.get('/', (req, res) => {
  res.send('Payment Platform API is running!');
});

// Global error handler
app.use(errorHandler);

// Test the database connection, retrying with exponential backoff
async function connectWithRetry(retries = 10, initialDelay = 1000) {
  let delay = initialDelay;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await sequelize.authenticate();
      logger.info('Database connected successfully.');
      return;
    } catch (error) {
      logger.error(`Connection attempt ${attempt}/${retries} failed: ${error.message}`);
      if (attempt === retries) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
}

async function start() {
  await connectWithRetry();
  // Creates tables on a fresh database; changes to existing tables are made by migrations (npm run migrate).
  await sequelize.sync();

  const autopayTask = startAutopayCron();
  const server = app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
  });

  // Graceful Shutdown
  const shutdown = (signal) => {
    logger.info(`${signal} received, shutting down gracefully...`);
    autopayTask.stop();
    server.close(async () => {
      await sequelize.close();
      logger.info('Server has been shut down.');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((error) => {
  logger.error(`Failed to start server: ${error.stack || error.message}`);
  process.exit(1);
});
