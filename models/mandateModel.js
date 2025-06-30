const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class Mandate extends Model {}

Mandate.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    uuid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      unique: true,
    },

    receiverId: {
      type: DataTypes.INTEGER, // The merchant or service provider
      allowNull: false,
    },

    amountMax: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 1,
      },
    },

    frequency: {
      type: DataTypes.ENUM('2min', 'daily', 'weekly', 'monthly', 'yearly', 'asNeeded'),
      allowNull: false,
    },

    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    nextPaymentDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM('active', 'paused', 'cancelled', 'expired'),
      defaultValue: 'active',
    },
  },
  {
    sequelize,
    modelName: 'Mandate',
    tableName: 'mandates',
    timestamps: true,
  }
);

module.exports = Mandate;