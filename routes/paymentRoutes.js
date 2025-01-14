const express = require('express');
const { initiatePayment } = require('../controllers/paymentController');
const { getTransactionLogs } = require('../controllers/transactionController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/initiate', authMiddleware, initiatePayment);
router.get('/logs/:userId', authMiddleware, getTransactionLogs);

module.exports = router;
