'use strict';

const bcrypt = require('bcrypt');

const MONEY_COLUMNS = [
  ['users', 'balance'],
  ['transactions', 'amount'],
  ['products', 'price'],
  ['mandates', 'amountMax'],
  ['mandate_events', 'amountDebited'],
];

// Every step checks that its table exists: on a fresh database the tables are created
// afterwards by sequelize.sync() with the new schema already in place.
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const query = (sql, options = {}) => queryInterface.sequelize.query(sql, { transaction, ...options });
      const tables = await queryInterface.showAllTables({ transaction });

      // Money as exact decimals instead of FLOAT
      for (const [table, column] of MONEY_COLUMNS) {
        if (!tables.includes(table)) continue;
        await query(
          `ALTER TABLE "${table}" ALTER COLUMN "${column}" TYPE DECIMAL(14, 2) USING ROUND("${column}"::numeric, 2)`
        );
      }

      if (tables.includes('mandate_events')) {
        await query(`ALTER TABLE "mandate_events" ALTER COLUMN "amountDebited" SET DEFAULT 0`);
        await query(`ALTER TABLE "mandate_events" ADD COLUMN IF NOT EXISTS "eventType" VARCHAR(255)`);
        await query(`ALTER TABLE "mandate_events" ADD COLUMN IF NOT EXISTS "message" TEXT`);
      }

      // nextPaymentDate becomes a timestamp; mandates that never ran start from their startDate
      if (tables.includes('mandates')) {
        await query(
          `ALTER TABLE "mandates" ALTER COLUMN "nextPaymentDate" TYPE TIMESTAMP WITH TIME ZONE USING "nextPaymentDate"::timestamptz`
        );
        await query(
          `UPDATE "mandates" SET "nextPaymentDate" = "startDate"::timestamptz
           WHERE "nextPaymentDate" IS NULL AND "frequency" <> 'asNeeded'`
        );
      }

      // Hash payment PINs that are still stored in plain text
      if (tables.includes('users')) {
        const [users] = await query(`SELECT "id", "paymentPin" FROM "users"`);
        for (const { id, paymentPin } of users) {
          if (paymentPin.startsWith('$2')) continue;
          await query(`UPDATE "users" SET "paymentPin" = :hash WHERE "id" = :id`, {
            replacements: { hash: await bcrypt.hash(paymentPin, 10), id },
          });
        }
      }
    });
  },

  async down() {
    throw new Error('This migration hashes payment PINs and cannot be reversed.');
  },
};
