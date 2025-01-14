const User = require('../models/userModel');
const bcrypt = require('bcrypt');
// View user details excluding password
async function viewUserDetails(req, res) {
  try {
    const { userId } = req.user;  // Get the logged-in user ID from the token

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

async function forgetPin(req, res) {
    try {
      const { userId } = req.user;  // Get the logged-in user ID from the token
      const { password, newPin } = req.body;  // Get current password and new PIN from the request body
  
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
      user.paymentPin = newPin;  // Update the payment PIN
      await user.save();  // Save the updated user
  
      res.status(200).json({ message: 'Payment PIN reset successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
  

module.exports = {
  viewUserDetails,
  forgetPin,
};
