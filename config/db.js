const { Sequelize } = require('sequelize');
const config = require('./config');

const { url, ...options } = config[process.env.NODE_ENV || 'development'];
if (!url) {
  throw new Error('DB_URL is not set.');
}

const sequelize = new Sequelize(url, options);

module.exports = sequelize;
