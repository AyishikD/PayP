const { Op } = require('sequelize');
const Transaction = require('../models/transactionModel');

// In-memory queue
const transactionLogsQueue = [];
let isProcessingTransactionLogs = false;

// Helper function to process the transaction logs queue
async function processTransactionLogsQueue() {
  if (isProcessingTransactionLogs || transactionLogsQueue.length === 0) return;

  isProcessingTransactionLogs = true;
  const { req, res, next } = transactionLogsQueue.shift(); // Get the first request in the queue

  try {
    const userId = parseInt(req.params.userId, 10);

    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format.' });
    }

    // Extract pagination parameters
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    // Fetch total transaction count for the user
    const totalTransactions = await Transaction.count({
      where: {
        [Op.or]: [{ senderId: userId }, { receiverId: userId }],
      },
    });

    // Fetch transactions with pagination
    const transactions = await Transaction.findAll({
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

    // Calculate total pages
    const totalPages = Math.ceil(totalTransactions / limit);

    res.status(200).json({
      transactions,
      pagination: {
        currentPage: page,
        totalPages,
        totalTransactions,
        limit,
      },
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);

    // Use Express v5's `next` to propagate unexpected errors
    next(error);
  } finally {
    isProcessingTransactionLogs = false;
    processTransactionLogsQueue(); // Process the next request in the queue
  }
}

// Fetch transaction logs
async function getTransactionLogs(req, res, next) {
  // Add the request to the queue
  transactionLogsQueue.push({ req, res, next });

  // Process the queue if not already processing
  processTransactionLogsQueue();
}

module.exports = {
  getTransactionLogs,
};
