const verifyPaymentPin = require('../utils/verifyPaymentPin');
const { transferFunds } = require('../utils/transfer');
const { parseAmount, parseId } = require('../utils/validation');
const AppError = require('../utils/AppError');

// Send money from the logged-in user to another user
async function initiatePayment(req, res) {
  const { senderId, receiverId, amount, paymentPin } = req.body ?? {};
  const loggedInUserId = req.user.userId;

  // senderId is optional; if sent it must be the caller's own account.
  if (senderId !== undefined && Number(senderId) !== loggedInUserId) {
    throw new AppError(403, 'Unauthorized access. You can only initiate payments from your own account.');
  }

  const parsedReceiverId = parseId(receiverId, 'receiverId');
  const parsedAmount = parseAmount(amount);

  await verifyPaymentPin(loggedInUserId, paymentPin);
  const result = await transferFunds({
    senderId: loggedInUserId,
    receiverId: parsedReceiverId,
    amount: parsedAmount,
  });

  res.status(200).json({ message: 'Payment successful.', ...result });
}

module.exports = {
  initiatePayment,
};
