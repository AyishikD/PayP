const { check, validationResult } = require('express-validator');
const CircuitBreaker = require('opossum');
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Circuit Breaker configuration remains unchanged
const breakerOptions = {
  timeout: 5000, // Timeout after 5 seconds
  errorThresholdPercentage: 50, // Open circuit if 50% of requests fail
  resetTimeout: 10000, // Reset after 10 seconds
};

const breaker = new CircuitBreaker(async (req) => {
  return await loginUserLogic(req);
}, breakerOptions);

breaker.fallback(() => {
  return { message: 'Service temporarily unavailable. Please try again later.' };
});

breaker.on('open', () => console.warn('Circuit breaker opened for loginUser.'));
breaker.on('close', () => console.info('Circuit breaker closed for loginUser.'));

const authRequestQueue = [];
let isProcessingAuth = false;

// Helper function to process the auth queue
async function processAuthQueue() {
  if (isProcessingAuth || authRequestQueue.length === 0) return;

  isProcessingAuth = true;
  const { req, res, handler } = authRequestQueue.shift();

  try {
    await handler(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    isProcessingAuth = false;
    processAuthQueue();
  }
}

// Middleware to validate registration input
const validateRegistration = [
  check('name').notEmpty().withMessage('Name is required.'),
  check('email').isEmail().withMessage('Invalid email address.'),
  check('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.')
    .matches(/\d/).withMessage('Password must contain at least one number.'),
  check('paymentPin')
    .isNumeric().withMessage('Payment Pin must be numeric.')
    .isLength({ min: 5, max: 5 }).withMessage('Payment Pin must be exactly 5 digits.'),
];

// Middleware to validate login input
const validateLogin = [
  check('email').isEmail().withMessage('Invalid email address.'),
  check('password').notEmpty().withMessage('Password is required.'),
];

// Register User Handler
async function registerUserHandler(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password, paymentPin } = req.body;

  const userExists = await User.findOne({ where: { email } });
  if (userExists) {
    return res.status(400).json({ message: 'User already exists.' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
 /* const hashedPaymentPin = await bcrypt.hash(paymentPin, 5);
  //console.log(hashedPaymentPin);*/
  

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    paymentPin,
  });

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);

  res.status(201).json({ token });
}

async function registerUser(req, res) {
  authRequestQueue.push({ req, res, handler: registerUserHandler });
  processAuthQueue();
}

// Login User Handler
async function loginUserHandler(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  const user = await User.findOne({ where: { email } });
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  // Check if the account is locked and if the lockout has expired
  const currentTime = new Date();
  if (user.isLocked) {
    if (user.lockoutExpiresAt && currentTime < user.lockoutExpiresAt) {
      const lockoutRemainingTime = user.lockoutExpiresAt - currentTime;
      return res.status(400).json({
        message: `Account is locked. Try again after ${Math.ceil(lockoutRemainingTime / 60000)} minutes.`,
      });
    } else {
      user.isLocked = false;
      user.failedLoginAttempts = 0;
      user.lockoutExpiresAt = null;
      await user.save();
    }
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) {
    user.failedLoginAttempts += 1;

    if (user.failedLoginAttempts > 5) {
      const lockoutDuration = 30 * 60 * 1000; // 30 minutes
      user.isLocked = true;
      user.lockoutExpiresAt = new Date(currentTime.getTime() + lockoutDuration);
      await user.save();
      return res.status(400).json({
        message: 'Account is locked due to too many failed login attempts. Try again later.',
      });
    }

    await user.save();
    return res.status(400).json({ message: 'Invalid credentials.' });
  }

  user.failedLoginAttempts = 0;
  await user.save();

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
  res.status(200).json({ token });
}

async function loginUser(req, res) {
  authRequestQueue.push({ req, res, handler: loginUserHandler });
  processAuthQueue();
}

module.exports = {
  registerUser: [...validateRegistration, registerUser],
  loginUser: [...validateLogin, loginUser],
};
