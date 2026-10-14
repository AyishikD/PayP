const bcrypt = require('bcrypt');
const User = require('../models/userModel');
const AppError = require('./AppError');
const { logger } = require('./logger');

const MAX_PIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 60 * 1000;

// Throws an AppError unless `paymentPin` matches the user's hashed PIN. Locks the account after repeated failures.
async function verifyPaymentPin(userId, paymentPin) {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError(404, 'User not found.');
  }

  const currentTime = new Date();
  if (user.isLocked) {
    if (user.lockoutExpiresAt && currentTime < user.lockoutExpiresAt) {
      const minutesLeft = Math.ceil((user.lockoutExpiresAt - currentTime) / 60000);
      throw new AppError(403, `Account is locked. Try again after ${minutesLeft} minutes.`);
    }
    user.isLocked = false;
    user.failedPinAttempts = 0;
    user.lockoutExpiresAt = null;
  }

  const pin = typeof paymentPin === 'number' ? String(paymentPin) : paymentPin;
  const isValid = typeof pin === 'string' && pin.length > 0 && (await bcrypt.compare(pin, user.paymentPin));

  if (!isValid) {
    user.failedPinAttempts += 1;
    if (user.failedPinAttempts >= MAX_PIN_ATTEMPTS) {
      user.isLocked = true;
      user.lockoutExpiresAt = new Date(currentTime.getTime() + LOCKOUT_DURATION_MS);
      await user.save();
      logger.warn(`User ID ${userId} locked due to too many failed PIN attempts.`);
      throw new AppError(403, 'Account is locked due to too many failed attempts. Try again after 30 minutes.');
    }
    await user.save();
    logger.warn(`Invalid payment PIN attempt for User ID ${userId}`);
    throw new AppError(400, 'Invalid payment PIN.');
  }

  user.failedPinAttempts = 0;
  await user.save();
}

module.exports = verifyPaymentPin;
