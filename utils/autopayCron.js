const cron = require('node-cron');
const { Op } = require('sequelize');
const sequelize = require('../config/db');
const Mandate = require('../models/mandateModel');
const MandateEvent = require('../models/mandateEventModel');
const AppError = require('./AppError');
const { transferFunds } = require('./transfer');
const { nextDueDate, endOfDay } = require('./schedule');
const { logger } = require('./logger');

let isRunning = false;

// Debits one mandate if it is still due. Row locking with SKIP LOCKED means two server
// instances (or an overlapping run) never debit the same mandate twice.
async function processMandate(mandateId, now) {
  await sequelize.transaction(async (t) => {
    const mandate = await Mandate.findByPk(mandateId, {
      lock: t.LOCK.UPDATE,
      skipLocked: true,
      transaction: t,
    });
    if (!mandate || mandate.status !== 'active' || !mandate.nextPaymentDate || mandate.nextPaymentDate > now) {
      return;
    }

    if (mandate.endDate && now > endOfDay(mandate.endDate)) {
      mandate.status = 'expired';
      await mandate.save({ transaction: t });
      await MandateEvent.create(
        { mandateId, eventType: 'expired', message: 'Mandate reached its end date.', status: 'meta', executedAt: now },
        { transaction: t }
      );
      return;
    }

    const amount = Number(mandate.amountMax);
    let event;
    try {
      // A savepoint, so a failed transfer rolls back only itself and the mandate still advances.
      const { transaction } = await sequelize.transaction({ transaction: t }, (savepoint) =>
        transferFunds({ senderId: mandate.senderId, receiverId: mandate.receiverId, amount }, savepoint)
      );
      event = {
        eventType: 'payment_success',
        status: 'success',
        amountDebited: amount,
        transactionId: transaction.transactionId,
        message: `₹${amount} paid successfully.`,
      };
    } catch (error) {
      if (!(error instanceof AppError)) throw error;
      event = {
        eventType: 'payment_failed',
        status: 'failed',
        amountDebited: 0,
        failureReason: error.message,
        message: 'Mandate payment failed.',
      };
    }

    // Skip any slots missed while the server was down instead of charging for each one.
    let next = nextDueDate(mandate.nextPaymentDate, mandate.frequency);
    while (next <= now) {
      next = nextDueDate(next, mandate.frequency);
    }
    mandate.nextPaymentDate = next;
    await mandate.save({ transaction: t });

    await MandateEvent.create(
      {
        mandateId,
        ...event,
        message: `${event.message} Next payment scheduled for ${next.toISOString()}.`,
        executedAt: now,
      },
      { transaction: t }
    );
  });
}

async function processDueMandates() {
  if (isRunning) return;
  isRunning = true;

  try {
    const now = new Date();
    const dueMandates = await Mandate.findAll({
      attributes: ['id'],
      where: {
        status: 'active',
        frequency: { [Op.ne]: 'asNeeded' },
        nextPaymentDate: { [Op.lte]: now },
      },
    });

    for (const { id } of dueMandates) {
      try {
        await processMandate(id, now);
      } catch (error) {
        logger.error(`Autopay failed for mandate ${id}: ${error.stack || error.message}`);
      }
    }
  } catch (error) {
    logger.error(`Autopay run failed: ${error.stack || error.message}`);
  } finally {
    isRunning = false;
  }
}

function startAutopayCron() {
  return cron.schedule('* * * * *', processDueMandates);
}

module.exports = { startAutopayCron, processDueMandates };
