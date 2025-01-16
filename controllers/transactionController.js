const { Op } = require('sequelize');
const Transaction = require('../models/transactionModel');

// In-memory queue
const transactionLogsQueue = [];
let isProcessingTransactionLogs = false;

// Helper function to process the transaction logs queue
async function processTransactionLogsQueue() {
  if (isProcessingTransactionLogs || transactionLogsQueue.length === 0) return;

  isProcessingTransactionLogs = true;
  const { req, res } = transactionLogsQueue.shift(); // Get the first request in the queue

  try {
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
  } finally {
    isProcessingTransactionLogs = false;
    processTransactionLogsQueue(); // Process the next request in the queue
  }
}

// Fetch transaction logs
async function getTransactionLogs(req, res) {
  transactionLogsQueue.push({ req, res }); // Add the request to the queue
  processTransactionLogsQueue(); // Start processing the queue
}

module.exports = {
  getTransactionLogs,
};
