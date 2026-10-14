const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class MandateEvent extends Model {}

MandateEvent.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    mandateId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'mandates',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },

    eventType: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // The transaction created by this event, if any.
    transactionId: {
      type: DataTypes.UUID,
      allowNull: true,
    },

    amountDebited: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
    },

    // 'meta' marks lifecycle events (created, paused, ...) that move no money.
    status: {
      type: DataTypes.ENUM('success', 'failed', 'skipped', 'meta'),
      defaultValue: 'success',
    },

    failureReason: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    executedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'MandateEvent',
    tableName: 'mandate_events',
    timestamps: true,
  }
);

module.exports = MandateEvent;