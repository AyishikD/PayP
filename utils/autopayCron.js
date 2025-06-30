const cron = require('node-cron');
const Mandate = require('../models/mandateModel');
const MandateEvent  = require('../models/mandateEventModel');
const User = require('../models/userModel');
const { v4: uuidv4 } = require('uuid');
const Transaction = require('../models/transactionModel');

cron.schedule('* * * * *', async () => {
  const now = new Date();

  const activeMandates = await Mandate.findAll({ where: { status: 'active' } });

  for (const mandate of activeMandates) {
    const lastDate = new Date(mandate.nextPaymentDate || mandate.startDate);

    // Check if mandate has started
    if (lastDate > now || now > new Date(mandate.endDate)) continue;

    // Check if it's time to process based on frequency
    const diffMs = now - lastDate;

    const frequencyMap = {
      '2min': 2 * 60 * 1000,
      '10min': 10 * 60 * 1000,
      'daily': 24 * 60 * 60 * 1000,
      'weekly': 7 * 24 * 60 * 60 * 1000,
      'monthly': 30 * 24 * 60 * 60 * 1000, 
      'yearly': 365 * 24 * 60 * 60 * 1000,
    };

    const interval = frequencyMap[mandate.frequency] || frequencyMap['monthly'];
    if (diffMs < interval) continue;

    // Fetch users
    const sender = await User.findByPk(mandate.senderId);
    const receiver = await User.findByPk(mandate.receiverId);
    if (!sender || !receiver) continue;

    if (sender.balance >= mandate.amount) {
      sender.balance -= mandate.amount;
      receiver.balance += mandate.amount;
      await sender.save();
      await receiver.save();

      await Transaction.create({
        transactionId: uuidv4(),
        senderId: sender.id,
        receiverId: receiver.id,
        amount: mandate.amount,
        status: 'success',
      });

      await MandateEvent.create({
        mandateId: mandate.id,
        eventType: 'payment_success',
        message: `₹${mandate.amount} paid successfully.`,
        amountDebited: amount,
      });
    } else {
      await MandateEvent.create({
        mandateId: mandate.id,
        eventType: 'failed_payment',
        message: 'Insufficient balance for mandate payment.',
      });
    }

    // Update nextPaymentDate
    mandate.nextPaymentDate = new Date(lastDate.getTime() + interval);
    await mandate.save();

    await MandateEvent.create({
      mandateId: mandate.id,
      eventType: 'next_trigger',
      message: `Next payment scheduled for ${mandate.nextPaymentDate.toISOString()}`,
    });
  }
});