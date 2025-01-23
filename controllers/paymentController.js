const User = require('../models/userModel');
const Transaction = require('../models/transactionModel');
const verifyPaymentPin = require('../utils/verifyPaymentPin');
const CircuitBreaker = require('opossum');
const jwt = require('jsonwebtoken');

// Circuit Breaker options
const breakerOptions = {
  timeout: 5000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
};

const paymentBreaker = new CircuitBreaker(async (req) => {
  return await initiatePaymentLogic(req);
}, breakerOptions);

paymentBreaker.fallback(() => {
  return { message: 'Payment service temporarily unavailable. Please try again later.' };
});

paymentBreaker.on('open', () => console.warn('Circuit breaker opened for initiatePayment.'));
paymentBreaker.on('close', () => console.info('Circuit breaker closed for initiatePayment.'));

const paymentRequestQueue = [];
let isProcessingPayment = false;

// Helper function to process the payment queue
async function processPaymentQueue() {
  if (isProcessingPayment || paymentRequestQueue.length === 0) return;

  isProcessingPayment = true;
  const { req, res } = paymentRequestQueue.shift();

  try {
    const result = await initiatePaymentLogic(req);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  } finally {
    isProcessingPayment = false;
    processPaymentQueue();
  }
}

// Payment Logic
async function initiatePaymentLogic(req) {
  const { senderId, receiverId, amount, paymentPin } = req.body;

  // Extract the logged-in user's ID from the JWT token
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    throw new Error('Authentication token is required.');
  }

  let decodedToken;
  try {
    decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token.');
  }

  const loggedInUserId = decodedToken.userId;

  // Ensure the senderId matches the logged-in user's ID
  if (senderId !== loggedInUserId) {
    throw new Error('Unauthorized access. You can only initiate payments from your own account.');
  }

  // Find sender and receiver users
  const sender = await User.findByPk(senderId);
  const receiver = await User.findByPk(receiverId);

  if (!sender || !receiver) {
    throw new Error('Sender or Receiver not found');
  }

  // Check if the sender's account is locked
  if (sender.isLocked) {
    throw new Error('Account is locked due to too many failed payment PIN attempts. Try again later.');
  }

  // Verify the sender's payment PIN
  const pinVerification = await verifyPaymentPin(senderId, paymentPin);
  if (pinVerification.error) {
    throw new Error(pinVerification.error);
  }

  // Check if sender has sufficient balance
  if (sender.balance < amount) {
    throw new Error('Insufficient funds.');
  }

  // Deduct the amount from sender's balance and add it to receiver's balance
  sender.balance -= amount;
  receiver.balance += amount;

  // Save the updated balances
  await sender.save();
  await receiver.save();

  // Create a transaction record in the database
  const transaction = await Transaction.create({
    senderId,
    receiverId,
    amount,
    status: 'completed',
    transactionId: generateTransactionId(),
  });

  return {
    message: 'Payment successful.',
    transaction,
    senderBalance: sender.balance,
    receiverBalance: receiver.balance,
  };
}

// Handle payment requests
async function initiatePayment(req, res) {
  paymentRequestQueue.push({ req, res });
  processPaymentQueue();
}

// Generate a unique transaction ID
function generateTransactionId() {
  return `txn-${Math.floor(100000 + Math.random() * 900000)}`;
}

module.exports = {
  initiatePayment,
};
