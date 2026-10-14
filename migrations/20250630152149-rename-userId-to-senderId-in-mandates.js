'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // On a fresh database the enum doesn't exist yet; sequelize.sync() creates it with 'meta' included.
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_mandate_events_status') THEN
          ALTER TYPE "enum_mandate_events_status" ADD VALUE IF NOT EXISTS 'meta';
        END IF;
      END
      $$;
    `);
  },

  async down() {},
};
