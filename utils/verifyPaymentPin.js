const User = require('../models/userModel'); 

async function verifyPaymentPin(userId, paymentPin) {
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return false; // User not found
    }
    // Check if the account is locked and if the lockout has expired
    const currentTime = new Date();
    if (user.isLocked) {
      if (user.lockoutExpiresAt && currentTime < user.lockoutExpiresAt) {
        const lockoutRemainingTime = user.lockoutExpiresAt - currentTime;
        return { error: `Account is locked. Try again after ${Math.ceil(lockoutRemainingTime / 60000)} minutes.` };
      } else {
        // Lockout has expired, reset the lockout
        user.isLocked = false;
        user.failedPinAttempts = 0;
        user.lockoutExpiresAt = null;
        await user.save();
      }
    }

    // Compare the provided PIN with the stored PIN
    if (user.paymentPin !== paymentPin) {
      // Increment the failed PIN attempts
      user.failedPinAttempts += 1;

      // Lock the account after 5 failed attempts
      if (user.failedPinAttempts > 5) {
        // Set the lockout expiration time (e.g., 30 minutes from now)
        const lockoutDuration = 30 * 60 * 1000; // 30 minutes
        user.isLocked = true;
        user.lockoutExpiresAt = new Date(currentTime.getTime() + lockoutDuration);
        await user.save();
        return { error: 'Account is locked due to too many failed attempts. Try again later after 30 minutes.' };
      }

      // Save the user with updated failedPinAttempts
      await user.save();
      return { error: 'Invalid payment PIN' };
    }

    // Reset the failed attempts on successful PIN verification
    user.failedPinAttempts = 0;
    await user.save();
    return { isValid: true }; // PIN is valid

  } catch (error) {
    console.error(error);
    return false; // Error case
  }
}

module.exports = verifyPaymentPin;
