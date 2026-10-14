const { Op } = require('sequelize');
const Transaction = require('../models/transactionModel');
const AppError = require('../utils/AppError');

const MAX_PAGE_SIZE = 100;

// Fetch the logged-in user's transaction logs
async function getTransactionLogs(req, res) {
  const userId = Number(req.params.userId);

  if (!Number.isInteger(userId)) {
    throw new AppError(400, 'Invalid user ID format.');
  }
  if (userId !== req.user.userId) {
    throw new AppError(403, 'You can only view your own transactions.');
  }

  // Extract pagination parameters
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), MAX_PAGE_SIZE);
  const offset = (page - 1) * limit;

  const { count: totalTransactions, rows: transactions } = await Transaction.findAndCountAll({
    where: {
      [Op.or]: [{ senderId: userId }, { receiverId: userId }],
    },
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  if (!transactions.length) {
    return res.status(404).json({ message: 'No transactions found for this user.' });
  }

  res.status(200).json({
    transactions,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalTransactions / limit),
      totalTransactions,
      limit,
    },
  });
}

module.exports = {
  getTransactionLogs,
};
