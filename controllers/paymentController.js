const User = require('../models/userModel'); 
const Transaction = require('../models/transactionModel');
const verifyPaymentPin = require('../utils/verifyPaymentPin'); 
const CircuitBreaker = require('opossum');

// Define circuit breaker options
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
  const { req, res } = paymentRequestQueue.shift(); // Get the first request in the queue

  try {
    const result = await initiatePaymentLogic(req); // Process the payment logic
    res.status(200).json(result); // Send the response
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' }); // Handle errors
  } finally {
    isProcessingPayment = false;
    processPaymentQueue(); // Process the next request in the queue
  }
}

// Payment Logic
async function initiatePaymentLogic(req) {
  const { senderId, receiverId, amount, paymentPin } = req.body;

  // Find sender and receiver users
  const sender = await User.findByPk(senderId);
  const receiver = await User.findByPk(receiverId);

  if (!sender || !receiver) {
    throw new Error('Sender or Receiver not found');
  }

  // Check if the sender's account is locked
  if (sender.isLocked) {
    throw new Error('Account is locked due to too many failed payment PIN attempts. Try again later after 30 minutes.');
  }

  // Verify the sender's payment PIN
  const pinVerification = await verifyPaymentPin(senderId, paymentPin);
  if (pinVerification.error) {
    throw new Error(pinVerification.error);
  }

  // Check if sender has sufficient balance
  if (sender.balance < amount) {
    throw new Error('Insufficient funds');
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
    message: 'Payment successful',
    transaction,
    senderBalance: sender.balance,
    receiverBalance: receiver.balance,
  };
}

// Handle payment requests
async function initiatePayment(req, res) {
  paymentRequestQueue.push({ req, res }); // Add the request to the queue
  processPaymentQueue(); // Start processing the queue
}

// Generate a unique transaction ID
function generateTransactionId() {
  return `txn-${Math.floor(100000 + Math.random() * 900000)}`;
}

module.exports = {
  initiatePayment,
};