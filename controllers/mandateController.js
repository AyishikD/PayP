const sequelize = require('../config/db');
const Mandate = require('../models/mandateModel');
const MandateEvent = require('../models/mandateEventModel');
const User = require('../models/userModel');
const AppError = require('../utils/AppError');
const { parseAmount, parseId, parseDateOnly } = require('../utils/validation');

const FREQUENCIES = Mandate.getAttributes().frequency.values;

// Status changes a user may make. 'expired' is set only by the autopay job.
const ALLOWED_TRANSITIONS = {
  active: ['paused', 'cancelled'],
  paused: ['active', 'cancelled'],
};

// ──────── CREATE MANDATE ────────
async function createMandate(req, res) {
  const senderId = req.user.userId;
  const { receiverId, amount, frequency, startDate, endDate } = req.body ?? {};

  const parsedReceiverId = parseId(receiverId, 'receiverId');
  const parsedAmount = parseAmount(amount);
  if (!FREQUENCIES.includes(frequency)) {
    throw new AppError(400, `frequency must be one of: ${FREQUENCIES.join(', ')}.`);
  }
  parseDateOnly(startDate, 'startDate');
  if (endDate !== undefined && endDate !== null) {
    parseDateOnly(endDate, 'endDate');
    if (endDate < startDate) {
      throw new AppError(400, 'endDate must be on or after startDate.');
    }
  }
  if (startDate < new Date().toISOString().slice(0, 10)) {
    throw new AppError(400, 'startDate cannot be in the past.');
  }
  if (parsedReceiverId === senderId) {
    throw new AppError(400, 'You cannot create a mandate to yourself.');
  }
  if (!(await User.findByPk(parsedReceiverId))) {
    throw new AppError(404, 'Receiver not found.');
  }

  const mandate = await sequelize.transaction(async (t) => {
    const created = await Mandate.create(
      {
        senderId,
        receiverId: parsedReceiverId,
        amountMax: parsedAmount,
        frequency,
        startDate,
        endDate: endDate ?? null,
        nextPaymentDate: frequency === 'asNeeded' ? null : new Date(`${startDate}T00:00:00Z`),
        status: 'active',
      },
      { transaction: t }
    );

    await MandateEvent.create(
      {
        mandateId: created.id,
        eventType: 'created',
        message: 'Mandate successfully created by user',
        amountDebited: 0,
        status: 'meta',
      },
      { transaction: t }
    );

    return created;
  });

  res.status(201).json({ message: 'Mandate created successfully', mandate });
}

// ──────── UPDATE MANDATE STATUS ────────
async function updateMandateStatus(req, res) {
  const mandateId = parseId(req.params.mandateId, 'mandateId');
  const { status, reason } = req.body ?? {};

  if (!['active', 'paused', 'cancelled'].includes(status)) {
    throw new AppError(400, 'Invalid status. Use active, paused, or cancelled.');
  }

  await sequelize.transaction(async (t) => {
    // Lock the row so the autopay job cannot debit it while its status is changing.
    const mandate = await Mandate.findByPk(mandateId, { lock: t.LOCK.UPDATE, transaction: t });
    if (!mandate) {
      throw new AppError(404, 'Mandate not found.');
    }
    if (mandate.senderId !== req.user.userId) {
      throw new AppError(403, 'You can only change your own mandates.');
    }
    if (!(ALLOWED_TRANSITIONS[mandate.status] || []).includes(status)) {
      throw new AppError(409, `Cannot change a ${mandate.status} mandate to ${status}.`);
    }

    mandate.status = status;
    await mandate.save({ transaction: t });

    await MandateEvent.create(
      {
        mandateId,
        eventType: status,
        message: typeof reason === 'string' && reason ? reason : `${status} triggered`,
        amountDebited: 0,
        status: 'meta',
        executedAt: new Date(),
      },
      { transaction: t }
    );
  });

  res.status(200).json({ message: `Mandate ${status} successfully.` });
}

// ──────── GET MANDATE EVENTS ────────
async function getMandateEvents(req, res) {
  const mandateId = parseId(req.params.mandateId, 'mandateId');

  const mandate = await Mandate.findByPk(mandateId);
  if (!mandate) {
    throw new AppError(404, 'Mandate not found.');
  }
  if (![mandate.senderId, mandate.receiverId].includes(req.user.userId)) {
    throw new AppError(403, 'You can only view events for your own mandates.');
  }

  const events = await MandateEvent.findAll({
    where: { mandateId },
    order: [['executedAt', 'ASC']],
  });
  res.status(200).json({ events });
}

module.exports = {
  createMandate,
  updateMandateStatus,
  getMandateEvents,
};
