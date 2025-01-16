const User = require('../models/userModel');
const bcrypt = require('bcrypt');

// In-memory queue
const userQueue = [];
let isProcessingUserQueue = false;

// Helper function to process the user queue
async function processUserQueue() {
  if (isProcessingUserQueue || userQueue.length === 0) return;

  isProcessingUserQueue = true;
  const { req, res, handler } = userQueue.shift(); // Get the first request in the queue

  try {
    await handler(req, res); // Execute the handler for the request
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    isProcessingUserQueue = false;
    processUserQueue(); // Process the next request in the queue
  }
}

// Queue wrapper function
function enqueueUserRequest(handler) {
  return (req, res) => {
    userQueue.push({ req, res, handler }); // Add the request and its handler to the queue
    processUserQueue(); // Start processing the queue
  };
}

// View user details excluding password
async function viewUserDetailsHandler(req, res) {
  try {
    const { userId } = req.user; // Get the logged-in user ID from the token

    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }, // Exclude password from the response
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        balance: user.balance, // Include balance
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}

// Forget payment PIN
async function forgetPinHandler(req, res) {
  try {
    const { userId } = req.user; // Get the logged-in user ID from the token
    const { password, newPin } = req.body; // Get current password and new PIN from the request body

    // Find the user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify the current password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: 'Invalid current password' });
    }

    // Update the payment PIN
    user.paymentPin = newPin; // Update the payment PIN
    await user.save(); // Save the updated user

    res.status(200).json({ message: 'Payment PIN reset successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}

// Export handlers wrapped with the queue logic
module.exports = {
  viewUserDetails: enqueueUserRequest(viewUserDetailsHandler),
  forgetPin: enqueueUserRequest(forgetPinHandler),
};
