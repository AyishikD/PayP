const { Op } = require('sequelize');
const Transaction = require('../models/transactionModel');

// Fetch transaction logs for a particular user
async function getTransactionLogs(req, res) {
  try {
    // Convert userId to an integer
    const userId = parseInt(req.params.userId, 10);

    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const transactions = await Transaction.findAll({
      where: {
        [Op.or]: [{ senderId: userId }, { receiverId: userId }],
      },
      order: [['createdAt', 'DESC']],
    });

    if (!transactions.length) {
      return res.status(404).json({ message: 'No transactions found for this user' });
    }

    res.status(200).json({ transactions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching transactions' });
  }
}

module.exports = {
  getTransactionLogs,
};
