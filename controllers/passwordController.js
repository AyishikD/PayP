const bcrypt = require('bcrypt');
const User = require('../models/userModel');

// In-memory queue
const requestQueue = [];
let isProcessing = false;

// Helper function to process the queue
async function processQueue() {
  if (isProcessing || requestQueue.length === 0) return;

  isProcessing = true;
  const { req, res, next } = requestQueue.shift(); // Remove the first request in the queue

  try {
    const { email, newPassword } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the account is locked due to failed reset attempts
    const currentTime = new Date();
    if (user.isLocked) {
      if (user.lockoutExpiresAt && currentTime < user.lockoutExpiresAt) {
        // Account is locked
        const lockoutRemainingTime = user.lockoutExpiresAt - currentTime;
        return res
          .status(400)
          .json({ message: `Account is locked. Try again after ${Math.ceil(lockoutRemainingTime / 60000)} minutes.` });
      } else {
        // Lockout has expired, reset the lockout
        user.isLocked = false;
        user.failedLoginAttempts = 0;
        user.lockoutExpiresAt = null;
        await user.save();
      }
    }

    // Update the password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    // Reset failed attempts on successful password reset
    user.failedLoginAttempts = 0;
    await user.save();

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error(error);
    next(error); // Pass the error to the Express v5 error handler
  } finally {
    isProcessing = false;
    processQueue(); // Process the next request in the queue
  }
}

// Forget Password (Queue Implementation)
async function forgetPassword(req, res, next) {
  // Add the request to the queue
  requestQueue.push({ req, res, next });

  // Process the queue if not already processing
  processQueue();
}

module.exports = {
  forgetPassword,
};
