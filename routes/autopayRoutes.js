const express = require('express');
const { createMandate } = require('../controllers/mandateController');
const { updateMandateStatus } = require('../controllers/mandateController');
const { getMandateEvents } = require('../controllers/mandateController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @route POST /mandate/create
 * @desc Create a recurring AutoPay mandate
 * @access Protected
 */
router.post('/create', authMiddleware, createMandate);

/**
 * @route PATCH /mandate/status/:mandateId
 * @desc Pause or cancel a mandate
 * @access Protected
 */
router.patch('/status/:mandateId', authMiddleware, updateMandateStatus);

/**
 * @route GET /mandate/events/:mandateId
 * @desc Get mandate event logs (payment triggers, failures, etc.)
 * @access Protected
 */
router.get('/events/:mandateId', authMiddleware, getMandateEvents);

module.exports = router;
