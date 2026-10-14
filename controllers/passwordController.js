const bcrypt = require('bcrypt');
const User = require('../models/userModel');
const AppError = require('../utils/AppError');
const { requiredString, passwordRules, rejectInvalid } = require('./authController');

// Changes the logged-in user's password. Requires the current password so a stolen token
// alone cannot take over the account.
async function forgetPassword(req, res) {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findByPk(req.user.userId);
  if (!user) {
    throw new AppError(404, 'User not found.');
  }

  const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
  if (!isPasswordCorrect) {
    throw new AppError(400, 'Invalid current password.');
  }

  user.password = await bcrypt.hash(newPassword, 10);
  user.failedLoginAttempts = 0;
  await user.save();

  res.status(200).json({ message: 'Password reset successfully' });
}

module.exports = {
  forgetPassword: [
    requiredString('currentPassword', 'Current password is required.'),
    passwordRules('newPassword'),
    rejectInvalid,
    forgetPassword,
  ],
};
