const { randomUUID } = require('crypto');
const sequelize = require('../config/db');
const User = require('../models/userModel');
const Transaction = require('../models/transactionModel');
const AppError = require('./AppError');

const toCents = (value) => Math.round(Number(value) * 100);

// Moves `amount` from sender to receiver atomically and records the transaction.
// Pass `t` to run inside an existing database transaction.
async function transferFunds({ senderId, receiverId, amount }, t) {
  if (!t) {
    return sequelize.transaction((tx) => transferFunds({ senderId, receiverId, amount }, tx));
  }

  if (senderId === receiverId) {
    throw new AppError(400, 'Sender and receiver must be different accounts.');
  }

  // Lock both rows in id order so two concurrent transfers between the same users cannot deadlock.
  const users = await User.findAll({
    where: { id: [senderId, receiverId] },
    order: [['id', 'ASC']],
    lock: t.LOCK.UPDATE,
    transaction: t,
  });
  const sender = users.find((user) => user.id === senderId);
  const receiver = users.find((user) => user.id === receiverId);

  if (!sender || !receiver) {
    throw new AppError(404, 'Sender or receiver not found.');
  }
  if (toCents(sender.balance) < toCents(amount)) {
    throw new AppError(400, 'Insufficient funds.');
  }

  await sender.decrement('balance', { by: amount, transaction: t });
  await receiver.increment('balance', { by: amount, transaction: t });
  await Promise.all([sender.reload({ transaction: t }), receiver.reload({ transaction: t })]);

  const transaction = await Transaction.create(
    {
      transactionId: randomUUID(),
      senderId,
      receiverId,
      amount,
      status: 'completed',
    },
    { transaction: t }
  );

  return {
    transaction,
    senderBalance: sender.balance,
    receiverBalance: receiver.balance,
  };
}

module.exports = { transferFunds };
