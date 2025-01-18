const bcrypt = require('bcrypt');
const User = require('../models/userModel'); 

async function verifyPaymentPin(userId, paymentPin) {
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return false; // User not found
    }

    const currentTime = new Date();
    if (user.isLocked) {
      if (user.lockoutExpiresAt && currentTime < user.lockoutExpiresAt) {
        const lockoutRemainingTime = user.lockoutExpiresAt - currentTime;
        return { error: `Account is locked. Try again after ${Math.ceil(lockoutRemainingTime / 60000)} minutes.` };
      } else {
        user.isLocked = false;
        user.failedPinAttempts = 0;
        user.lockoutExpiresAt = null;
        await user.save();
      }
    }

    // Compare the hashed payment PIN with the provided PIN
    const isPinCorrect = await bcrypt.compare(paymentPin, user.paymentPin);
    if (!isPinCorrect) {
      user.failedPinAttempts += 1;

      if (user.failedPinAttempts > 5) {
        const lockoutDuration = 30 * 60 * 1000; // 30 minutes
        user.isLocked = true;
        user.lockoutExpiresAt = new Date(currentTime.getTime() + lockoutDuration);
        await user.save();
        return { error: 'Account is locked due to too many failed attempts. Try again later after 30 minutes.' };
      }

      await user.save();
      return { error: 'Invalid payment PIN' };
    }

    user.failedPinAttempts = 0;
    await user.save();
    return { isValid: true }; // PIN is valid
  } catch (error) {
    console.error(error);
    return false; // Error case
  }
}

module.exports = verifyPaymentPin;
