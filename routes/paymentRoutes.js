const express = require('express');
const { initiatePayment } = require('../controllers/paymentController');
const { getTransactionLogs } = require('../controllers/transactionController');
const { processProjectPayment } = require('../controllers/projectController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     PaymentRequest:
 *       type: object
 *       required:
 *         - senderId
 *         - receiverId
 *         - amount
 *         - paymentPin
 *       properties:
 *         senderId:
 *           type: integer
 *           description: ID of the sender user.
 *         receiverId:
 *           type: integer
 *           description: ID of the receiver user.
 *         amount:
 *           type: number
 *           format: float
 *           description: Payment amount.
 *         paymentPin:
 *           type: string
 *           description: Payment PIN of the sender.
 *     PaymentResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Response message.
 *         transaction:
 *           type: object
 *           description: Transaction details.
 *         senderBalance:
 *           type: number
 *           description: Updated balance of the sender.
 *         receiverBalance:
 *           type: number
 *           description: Updated balance of the receiver.
 *     Transaction:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         transactionId:
 *           type: string
 *         senderId:
 *           type: integer
 *         receiverId:
 *           type: integer
 *         amount:
 *           type: float
 *         status:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /payment/initiate:
 *   post:
 *     summary: Initiate a payment transaction
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentRequest'
 *     responses:
 *       200:
 *         description: Payment transaction successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentResponse'
 *       400:
 *         description: Bad request, invalid input
 *       401:
 *         description: Unauthorized, authentication token missing or invalid
 *       500:
 *         description: Server error while processing payment
 */
router.post('/initiate', authMiddleware, initiatePayment);

/**
 * @swagger
 * /payment/logs/{userId}:
 *   get:
 *     summary: Retrieve transaction logs for a user
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: integer
 *         required: true
 *         description: User ID to fetch transaction logs.
 *     responses:
 *       200:
 *         description: Transaction logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: Invalid user ID format
 *       401:
 *         description: Unauthorized, authentication token missing or invalid
 *       404:
 *         description: No transactions found for the user
 *       500:
 *         description: Server error while fetching transactions
 */
router.get('/logs/:userId', authMiddleware, getTransactionLogs);

/**
 * @swagger
 * /payment/projectpay:
 *   post:
 *     summary: Process a project payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               projectId:
 *                 type: integer
 *                 description: ID of the project for which payment is being made.
 *               amount:
 *                 type: number
 *                 format: float
 *                 description: Payment amount for the project.
 *               paymentPin:
 *                 type: string
 *                 description: Payment PIN of the sender.
 *             required:
 *               - projectId
 *               - amount
 *               - paymentPin
 *     responses:
 *       200:
 *         description: Payment for the project successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Project payment processed successfully"
 *       400:
 *         description: Bad request, invalid input
 *       401:
 *         description: Unauthorized, authentication token missing or invalid
 *       500:
 *         description: Server error while processing project payment
 */
router.post('/projectpay', processProjectPayment);

module.exports = router;
