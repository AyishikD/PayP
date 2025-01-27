const Product = require('../models/productModel');
const Transaction = require('../models/transactionModel');
const User = require('../models/userModel');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const CircuitBreaker = require('opossum');

// Circuit Breaker configuration
const breakerOptions = {
  timeout: 5000, // Timeout after 5 seconds
  errorThresholdPercentage: 50, // Open circuit if 50% of requests fail
  resetTimeout: 10000, // Reset after 10 seconds
};

const breaker = new CircuitBreaker(async (job) => {
  return await payForProductLogic(job);
}, breakerOptions);

// Fallback when the circuit is open
breaker.fallback(() => {
  return { message: 'Service temporarily unavailable. Please try again later.' };
});

// Circuit breaker events
breaker.on('open', () => console.warn('Circuit breaker opened for payForProduct.'));
breaker.on('close', () => console.info('Circuit breaker closed for payForProduct.'));

// Product Request Queue
const paymentRequestQueue = [];
let isProcessingPaymentQueue = false;

// Helper function to process the payment queue
async function processPaymentQueue() {
  if (isProcessingPaymentQueue || paymentRequestQueue.length === 0) return;

  isProcessingPaymentQueue = true;
  const { req, res } = paymentRequestQueue.shift();

  try {
    req.body = { ...req.body }; // Clone request body to ensure immutability
    const result = await breaker.fire(req);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error processing payment request:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    isProcessingPaymentQueue = false;
    processPaymentQueue();
  }
}

// Logic for processing payment
async function payForProductLogic(req) {
  const { uuid } = req.params; // Product UUID from the URL
  const { senderId, password, paymentPin } = req.body;

  try {
    // Validate request
    if (!senderId || !password || !paymentPin) {
      throw new Error('Sender ID, password, and payment PIN are required');
    }

    // Fetch the product by UUID
    const product = await Product.findOne({ where: { uuid } });
    if (!product) {
      throw new Error('Product not found');
    }

    // Fetch the sender (user)
    const sender = await User.findByPk(senderId);
    if (!sender) {
      throw new Error('Sender not found');
    }

    // Fetch the receiver (user who added the product)
    const receiver = await User.findByPk(product.userId);
    if (!receiver) {
      throw new Error('Receiver (product owner) not found');
    }

    // Verify user password
    const isPasswordCorrect = await bcrypt.compare(password, sender.password);
    if (!isPasswordCorrect) {
      throw new Error('Invalid password');
    }

    // Verify payment PIN
    if (sender.paymentPin !== paymentPin) {
      throw new Error('Invalid payment PIN');
    }

    // Check sender's balance
    if (sender.balance < product.price) {
      throw new Error('Insufficient balance');
    }

    // Deduct balance from sender
    sender.balance -= product.price;
    await sender.save();

    // Add balance to receiver
    receiver.balance += product.price;
    await receiver.save();

    // Create a transaction
    const transaction = await Transaction.create({
      transactionId: uuidv4(),
      senderId, // Sender's user ID
      receiverId: receiver.id, // Receiver's user ID
      amount: product.price,
      status: 'success',
    });

    return {
      message: 'Payment successful',
      transaction,
      senderBalance: sender.balance,
      receiverBalance: receiver.balance,
    };
  } catch (error) {
    console.error('Error processing payment:', error);
    throw new Error('Internal server error');
  }
}

// Payment Controller
async function payForProduct(req, res) {
  paymentRequestQueue.push({ req, res });
  processPaymentQueue();
}

module.exports = { payForProduct };
