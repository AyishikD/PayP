const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class Product extends Model {}

Product.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true, // Keep as primary key if 'id' is still the primary identifier.
      autoIncrement: true, // Auto-increment if needed.
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    uuid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4, // Automatically generates a unique UUID for each product.
      unique: true, // Ensures globally unique identification for each product.
    },
  },
  {
    sequelize,
    modelName: 'Product',
    tableName: 'products',
    timestamps: false, // Disable timestamps if not required.
    uniqueKeys: {
      productUnique: {
        fields: ['id', 'userId'], // Enforce uniqueness of product ID per user.
      },
    },
  }
);

module.exports = Product;
