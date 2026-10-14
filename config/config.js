require('dotenv').config();

// SSL is on by default and verifies the server certificate. Set DB_SSL_REJECT_UNAUTHORIZED=false only
// for a provider whose certificate cannot be verified, and DB_SSL=false for a local database.
const sslEnabled = process.env.DB_SSL !== 'false';
const dialectOptions = sslEnabled
  ? {
      ssl: {
        require: true,
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
      },
    }
  : {};

const base = {
  url: process.env.DB_URL,
  dialect: 'postgres',
  dialectOptions,
  logging: false,
};

module.exports = {
  development: base,
  test: base,
  production: base,
};
