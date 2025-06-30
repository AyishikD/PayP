const Mandate = require('../models/mandateModel');
const MandateEvent = require('../models/mandateEventModel');
const jwt = require('jsonwebtoken');
const CircuitBreaker = require('opossum');

// ──────── QUEUE SETUP ────────
const mandateUpdateQueue = [];
let isProcessing = false;

// ──────── CIRCUIT BREAKER SETUP ────────
const breakerOptions = {
  timeout: 5000,
  errorThresholdPercentage: 50,
  resetTimeout: 10000,
  errorFilter: (err) =>
    err.message === 'Mandate not found.' ||
    err.message === 'Invalid mandate ID.'
};

const updateMandateBreaker = new CircuitBreaker(
  async ({ mandateId, status, reason }) => {
    const result = await updateMandateLogic(mandateId, status, reason);
    if (result.error) throw new Error(result.error);
    return result;
  },
  breakerOptions
);

updateMandateBreaker.fallback(() => {
  return { error: 'Service unavailable. Please try again later.' };
});

updateMandateBreaker.on('open', () =>
  console.warn('Circuit breaker opened for updateMandate.')
);
updateMandateBreaker.on('close', () =>
  console.info('Circuit breaker closed for updateMandate.')
);
updateMandateBreaker.on('failure', (err) =>
  console.error('[BREAKER] Failure captured:', err.message, err.stack)
);

// ──────── CREATE MANDATE ────────
async function createMandate(req, res) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Missing token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('[JWT Payload]', decoded);
    const userId = decoded.userId;

    const { receiverId, amount, frequency, startDate, endDate } = req.body;

    if (!receiverId || !amount || !frequency || !startDate || !endDate) {
      return res.status(400).json({ error: 'All mandate fields are required' });
    }

    const mandate = await Mandate.create({
      senderId: userId,
      receiverId,
      amountMax: amount,
      frequency,
      startDate,
      endDate,
      status: 'active',
    });

    await MandateEvent.create({
      mandateId: mandate.id,
      eventType: 'created',
      message: 'Mandate successfully created by user',
      amountDebited: amount,
    });

    res.status(201).json({ message: 'Mandate created successfully', mandate });
  } catch (error) {
    console.error('Mandate creation failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// ──────── UPDATE MANDATE STATUS ────────
async function updateMandateStatus(req, res) {
  const { mandateId } = req.params;
  const { status, reason } = req.body;

  if (!['paused', 'cancelled', 'expired'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Use paused, cancelled, or expired.' });
  }

  mandateUpdateQueue.push({ mandateId, status, reason, res });
  processMandateQueue();
}

async function processMandateQueue() {
  if (isProcessing || mandateUpdateQueue.length === 0) return;

  isProcessing = true;
  const { mandateId, status, reason, res } = mandateUpdateQueue.shift();

  try {
    console.log('[QUEUE] Attempting to update mandate:', mandateId);
    const result = await updateMandateBreaker.fire({ mandateId, status, reason });

    if (result && result.error) {
      return res.status(404).json({ error: result.error });
    }

    return res.status(200).json({ message: `Mandate ${status} successfully.` });
  } catch (error) {
    console.error('[processMandateQueue] Circuit breaker failure:', error.message, error.stack);
    return res.status(503).json({ error: 'Service unavailable. Please try again later.' });
  } finally {
    isProcessing = false;
    processMandateQueue();
  }
}

// ──────── CORE MANDATE UPDATE LOGIC ────────
async function updateMandateLogic(mandateId, status, reason) {
  console.log('[MANDATE_LOGIC] Processing:', { mandateId, status, reason });

  const idNum = Number(mandateId);
  if (isNaN(idNum)) {
    console.error('Invalid mandateId:', mandateId);
    return { error: 'Invalid mandate ID.' };
  }

  let mandate;
  try {
    mandate = await Mandate.findOne({ where: { id: idNum } });
  } catch (err) {
    console.error('[MANDATE_LOGIC] DB fetch error:', err.message, err.stack);
    throw err;
  }

  if (!mandate) {
    console.error(`[MANDATE_LOGIC] Mandate not found:`, idNum);
    return { error: 'Mandate not found.' };
  }

  try {
    mandate.status = status;
    await mandate.save();
  } catch (err) {
    console.error('[MANDATE_LOGIC] Mandate save failed:', err.message, err.stack);
    throw err;
  }

  try {
    await MandateEvent.create({
      mandateId,
      eventType: status,
      message: reason || `${status} triggered`,
      amountDebited: 0,
      transactionId: null,
      status: 'meta',
      executedAt: new Date(),
    });
  } catch (err) {
    console.error('[MANDATE_LOGIC] Event creation failed:', err.message, err.stack);
    throw err;
  }

  console.log(`[MANDATE_LOGIC] Mandate updated to '${status}' for ID ${mandateId}`);
  return { success: true };
}

// ──────── GET MANDATE EVENTS ────────
async function getMandateEvents(req, res) {
  const { mandateId } = req.params;

  try {
    const events = await MandateEvent.findAll({ where: { mandateId } });
    if (!events.length) {
      return res.status(404).json({ message: 'No events found for this mandate.' });
    }
    res.status(200).json({ events });
  } catch (error) {
    console.error('Error fetching mandate events:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  createMandate,
  updateMandateStatus,
  getMandateEvents,
};