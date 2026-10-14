const express = require('express');
const { createMandate, updateMandateStatus, getMandateEvents } = require('../controllers/mandateController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Mandates
 *   description: Recurring AutoPay mandates
 */

/**
 * @swagger
 * /mandate/create:
 *   post:
 *     summary: Create a recurring AutoPay mandate from the logged-in user
 *     tags: [Mandates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [receiverId, amount, frequency, startDate]
 *             properties:
 *               receiverId:
 *                 type: integer
 *               amount:
 *                 type: number
 *                 description: Amount debited each cycle.
 *               frequency:
 *                 type: string
 *                 enum: [2min, daily, weekly, monthly, yearly, asNeeded]
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: First debit date (today or later).
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: Optional last date the mandate can debit.
 *     responses:
 *       201:
 *         description: Mandate created
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Receiver not found
 */
router.post('/create', authMiddleware, createMandate);

/**
 * @swagger
 * /mandate/status/{mandateId}:
 *   patch:
 *     summary: Pause, resume or cancel one of your mandates
 *     tags: [Mandates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mandateId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, paused, cancelled]
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status updated
 *       403:
 *         description: Not your mandate
 *       404:
 *         description: Mandate not found
 *       409:
 *         description: Status change not allowed from the current status
 */
router.patch('/status/:mandateId', authMiddleware, updateMandateStatus);

/**
 * @swagger
 * /mandate/events/{mandateId}:
 *   get:
 *     summary: Get event logs for a mandate you send or receive
 *     tags: [Mandates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mandateId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Mandate events
 *       403:
 *         description: Not your mandate
 *       404:
 *         description: Mandate not found
 */
router.get('/events/:mandateId', authMiddleware, getMandateEvents);

module.exports = router;
