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

    transactionId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
    },

    amountDebited: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },

    status: {
      type: DataTypes.ENUM('success', 'failed', 'skipped'),
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