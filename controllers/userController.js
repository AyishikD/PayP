const bcrypt = require('bcrypt');
const User = require('../models/userModel');
const AppError = require('../utils/AppError');
const { requiredString, pinRules, rejectInvalid } = require('./authController');

// View the logged-in user's details
async function viewUserDetails(req, res) {
  const user = await User.findByPk(req.user.userId);
  if (!user) {
    throw new AppError(404, 'User not found.');
  }

  res.status(200).json({
    user: {
      id: user.id,
      email: user.email,
      balance: user.balance,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  });
}

// Reset the logged-in user's payment PIN after confirming their password
async function forgetPin(req, res) {
  const { password, newPin } = req.body;

  const user = await User.findByPk(req.user.userId);
  if (!user) {
    throw new AppError(404, 'User not found.');
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) {
    throw new AppError(400, 'Invalid current password.');
  }

  user.paymentPin = await bcrypt.hash(newPin, 10);
  user.failedPinAttempts = 0;
  await user.save();

  res.status(200).json({ message: 'Payment PIN reset successfully' });
}

module.exports = {
  viewUserDetails,
  forgetPin: [
    requiredString('password', 'Password is required.'),
    pinRules('newPin'),
    rejectInvalid,
    forgetPin,
  ],
};
