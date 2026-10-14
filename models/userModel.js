const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db'); 

class User extends Model {}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true, 
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },    
    name: {
      type: DataTypes.STRING,
      allowNull: false, 
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, 
      validate: {
        isEmail: true, 
      },
    },
    balance: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 100000.0, 
      validate: {
        min: 0, 
      },
    },
    failedLoginAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    isLocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    // bcrypt hash of the 5-digit PIN; the PIN format is validated before hashing.
    paymentPin: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    failedPinAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    lockoutExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,  
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
  }
);

module.exports = User;
