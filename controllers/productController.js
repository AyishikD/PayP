const Product = require('../models/productModel');
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const CircuitBreaker = require('opossum');

// Circuit Breaker configuration
const breakerOptions = {
  timeout: 5000, // Timeout after 5 seconds
  errorThresholdPercentage: 50, // Open circuit if 50% of requests fail
  resetTimeout: 10000, // Reset after 10 seconds
};

const breaker = new CircuitBreaker(async (job) => {
  return await addProductLogic(job);
}, breakerOptions);

// Fallback when the circuit is open
breaker.fallback(() => {
  return { message: 'Service temporarily unavailable. Please try again later.' };
});

// Circuit breaker events
breaker.on('open', () => console.warn('Circuit breaker opened for addProduct.'));
breaker.on('close', () => console.info('Circuit breaker closed for addProduct.'));

// Product Request Queue
const productRequestQueue = [];
let isProcessingQueue = false;

// Helper function to process the product queue
async function processProductQueue() {
  if (isProcessingQueue || productRequestQueue.length === 0) return;

  isProcessingQueue = true;
  const { req, res } = productRequestQueue.shift();

  try {
    req.body = { ...req.body }; // Clone request body to ensure immutability
    const result = await breaker.fire(req);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error processing product request:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    isProcessingQueue = false;
    processProductQueue();
  }
}

// Logic for adding or updating the product
async function addProductLogic(req) {
  const { id, price } = req.body;

  try {
    // Check for required fields
    if (!id || !price) {
      throw new Error('Product ID and price are required');
    }

    // Fetch the token from the Authorization header
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      throw new Error('Authentication token is required.');
    }

    // Verify and decode the token
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired token.');
    }

    // Get the authenticated user's ID
    const loggedInUserId = decodedToken.userId;

    // Verify the user exists (optional check)
    const user = await User.findByPk(loggedInUserId);
    if (!user) {
      throw new Error('User not found.');
    }

    // Check if the product already exists for the authenticated user
    const existingProduct = await Product.findOne({ where: { id, userId: loggedInUserId } });

    if (existingProduct) {
      // Update the price if the product already exists
      existingProduct.price = price;
      await existingProduct.save();
      return {
        message: 'Product price updated successfully.',
        product: {
          id: existingProduct.id,
          userId: existingProduct.userId,
          price: existingProduct.price,
          uuid: existingProduct.uuid, // Include uuid in the response
        },
      };
    }

    // Create a new product for the authenticated user
    const product = await Product.create({ id, userId: loggedInUserId, price });
    return {
      message: 'Product added successfully.',
      product: {
        id: product.id,
        userId: product.userId,
        price: product.price,
        uuid: product.uuid, // Include uuid in the response
      },
    };
  } catch (error) {
    console.error('Error adding product:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new Error('Product with this ID already exists for this user.');
    }
    throw new Error('Internal server error.');
  }
}

// Product Controller
async function addProduct(req, res) {
  productRequestQueue.push({ req, res });
  processProductQueue();
}

module.exports = { addProduct };
