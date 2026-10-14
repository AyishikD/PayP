const AppError = require('./AppError');

const MAX_AMOUNT = 1000000;
const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const PIN_PATTERN = /^\d{5}$/;

// Accepts a number or numeric string with at most 2 decimal places and returns it as a number.
function parseAmount(value, field = 'amount') {
  const text = typeof value === 'number' ? String(value) : value;
  if (typeof text !== 'string' || !AMOUNT_PATTERN.test(text.trim())) {
    throw new AppError(400, `${field} must be a positive number with at most 2 decimal places.`);
  }

  const amount = Number(text);
  if (amount <= 0 || amount > MAX_AMOUNT) {
    throw new AppError(400, `${field} must be greater than 0 and at most ${MAX_AMOUNT}.`);
  }
  return amount;
}

// Accepts a positive integer or a string of digits and returns it as a number.
function parseId(value, field = 'id') {
  const isDigits = typeof value === 'string' && /^\d+$/.test(value);
  const id = isDigits ? Number(value) : value;
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new AppError(400, `${field} must be a positive integer.`);
  }
  return id;
}

// Accepts a YYYY-MM-DD string that is a real calendar date.
function parseDateOnly(value, field) {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) {
    throw new AppError(400, `${field} must be a date in YYYY-MM-DD format.`);
  }
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new AppError(400, `${field} is not a valid date.`);
  }
  return value;
}

function isValidPin(value) {
  return typeof value === 'string' && PIN_PATTERN.test(value);
}

module.exports = { parseAmount, parseId, parseDateOnly, isValidPin, MAX_AMOUNT };
