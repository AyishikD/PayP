const User = require('../models/userModel');
const { logger } = require('../utils/logger'); // Assuming you have a logger in your project

async function verifyPaymentPin(userId, paymentPin) {
  try {
    // Fetch the user from the database
    const user = await User.findByPk(userId);
    if (!user) {
      logger.warn(`User with ID ${userId} not found`);
      return { error: 'User not found' }; // Return error if user doesn't exist
    }

    const currentTime = new Date();

    // Check if the account is locked
    if (user.isLocked) {
      if (user.lockoutExpiresAt && currentTime < user.lockoutExpiresAt) {
        const lockoutRemainingTime = Math.ceil((user.lockoutExpiresAt - currentTime) / 60000); // Remaining time in minutes
        logger.warn(`Account locked for User ID ${userId}. Try again after ${lockoutRemainingTime} minutes.`);
        return { error: `Account is locked. Try again after ${lockoutRemainingTime} minutes.` };
      } else {
        // Reset lockout status if the lockout period has expired
        user.isLocked = false;
        user.failedPinAttempts = 0;
        user.lockoutExpiresAt = null;
        await user.save();
      }
    }

    // Verify the payment PIN
    if (user.paymentPin !== paymentPin) {
      // Increment the failed PIN attempts
      user.failedPinAttempts += 1;

      // Lock the account if the maximum attempts are exceeded
      if (user.failedPinAttempts >= 5) {
        const lockoutDuration = 30 * 60 * 1000; // Lockout duration (30 minutes)
        user.isLocked = true;
        user.lockoutExpiresAt = new Date(currentTime.getTime() + lockoutDuration);
        await user.save();
        logger.warn(`User ID ${userId} locked due to too many failed attempts.`);
        return { error: 'Account is locked due to too many failed attempts. Try again after 30 minutes.' };
      }

      // Save the updated failed attempts
      await user.save();
      logger.warn(`Invalid payment PIN attempt for User ID ${userId}`);
      return { error: 'Invalid payment PIN' };
    }

    // Reset failed attempts on successful PIN verification
    user.failedPinAttempts = 0;
    await user.save();

    logger.info(`Payment PIN verified successfully for User ID ${userId}`);
    return { isValid: true }; // PIN is valid

  } catch (error) {
    logger.error(`Error verifying payment PIN for User ID ${userId}: ${error.message}`);
    console.error('Error verifying payment PIN:', error);
    return { error: 'Internal server error' }; // Return a generic error message
  }
}

module.exports = verifyPaymentPin;
