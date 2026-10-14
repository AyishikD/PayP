const { check, validationResult } = require('express-validator');
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const AppError = require('../utils/AppError');

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 60 * 1000;

function rejectInvalid(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

// Rejects missing or non-string values with one message, without running the remaining checks.
const requiredString = (field, message) =>
  check(field).isString().withMessage(message).bail().notEmpty().withMessage(message);

const passwordRules = (field) =>
  check(field)
    .isString().withMessage('Password is required.').bail()
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.')
    .matches(/\d/).withMessage('Password must contain at least one number.');

const pinRules = (field) =>
  check(field)
    .isString().withMessage('Payment Pin must be a string of digits.').bail()
    .matches(/^\d{5}$/).withMessage('Payment Pin must be exactly 5 digits.');

// Middleware to validate registration input
const validateRegistration = [
  requiredString('name', 'Name is required.'),
  check('email').isEmail().withMessage('Invalid email address.'),
  passwordRules('password'),
  pinRules('paymentPin'),
  rejectInvalid,
];

// Middleware to validate login input
const validateLogin = [
  check('email').isEmail().withMessage('Invalid email address.'),
  check('password').isString().withMessage('Password is required.').bail().notEmpty().withMessage('Password is required.'),
  rejectInvalid,
];

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  });
}

async function registerUser(req, res) {
  const { name, email, password, paymentPin } = req.body;

  const userExists = await User.findOne({ where: { email } });
  if (userExists) {
    throw new AppError(400, 'User already exists.');
  }

  let user;
  try {
    user = await User.create({
      name,
      email,
      password: await bcrypt.hash(password, 10),
      paymentPin: await bcrypt.hash(paymentPin, 10),
    });
  } catch (error) {
    // Two registrations for the same email raced past the check above.
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new AppError(400, 'User already exists.');
    }
    throw error;
  }

  res.status(201).json({ token: signToken(user.id) });
}

async function loginUser(req, res) {
  const { email, password } = req.body;

  // Same response for unknown email and wrong password, so registered emails can't be discovered.
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new AppError(400, 'Invalid credentials.');
  }

  // Check if the account is locked and if the lockout has expired
  const currentTime = new Date();
  if (user.isLocked) {
    if (user.lockoutExpiresAt && currentTime < user.lockoutExpiresAt) {
      const minutesLeft = Math.ceil((user.lockoutExpiresAt - currentTime) / 60000);
      throw new AppError(403, `Account is locked. Try again after ${minutesLeft} minutes.`);
    }
    user.isLocked = false;
    user.failedLoginAttempts = 0;
    user.lockoutExpiresAt = null;
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) {
    user.failedLoginAttempts += 1;

    if (user.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
      user.isLocked = true;
      user.lockoutExpiresAt = new Date(currentTime.getTime() + LOCKOUT_DURATION_MS);
      await user.save();
      throw new AppError(403, 'Account is locked due to too many failed login attempts. Try again later.');
    }

    await user.save();
    throw new AppError(400, 'Invalid credentials.');
  }

  user.failedLoginAttempts = 0;
  await user.save();

  res.status(200).json({ token: signToken(user.id) });
}

module.exports = {
  registerUser: [...validateRegistration, registerUser],
  loginUser: [...validateLogin, loginUser],
  requiredString,
  passwordRules,
  pinRules,
  rejectInvalid,
};
