const User = require('../models/userModel'); 
const Transaction = require('../models/transactionModel');
const verifyPaymentPin = require('../utils/verifyPaymentPin'); 

async function initiatePayment(req, res) {
  try {
    const { senderId, receiverId, amount, paymentPin } = req.body;

    // Find sender and receiver users
    const sender = await User.findByPk(senderId);
    const receiver = await User.findByPk(receiverId);

    if (!sender || !receiver) {
      return res.status(404).json({ message: 'Sender or Receiver not found' });
    }

    // Check if the sender's account is locked
    if (sender.isLocked) {
      return res.status(400).json({ message: 'Account is locked due to too many failed payment PIN attempts. Try again later after 30 minutes.' });
    }

    // Verify the sender's payment PIN
    const pinVerification = await verifyPaymentPin(senderId, paymentPin);
    if (pinVerification.error) {
      return res.status(400).json({ message: pinVerification.error });
    }

    // Check if sender has sufficient balance
    if (sender.balance < amount) {
      return res.status(400).json({ message: 'Insufficient funds' });
    }

    // Deduct the amount from sender's balance and add it to receiver's balance
    sender.balance -= amount;
    receiver.balance += amount;

    // Save the updated balances
    await sender.save();
    await receiver.save();

    // Create a transaction record in the database
    const transaction = await Transaction.create({
      senderId,
      receiverId,
      amount,
      status: 'completed',
      transactionId: generateTransactionId(),
    });

    res.status(200).json({
      message: 'Payment successful',
      transaction,
      senderBalance: sender.balance,
      receiverBalance: receiver.balance,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}

// Generate a unique transaction ID
function generateTransactionId() {
  return `txn-${Math.floor(100000 + Math.random() * 900000)}`;
}

module.exports = {
  initiatePayment,
};
