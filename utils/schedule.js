const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;

// Adds whole months, clamping to the last day of the target month (Jan 31 + 1 month = Feb 28/29).
function addMonths(date, months) {
  const result = new Date(date);
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(day, lastDay));
  return result;
}

// Returns the due date that follows `date` for a mandate frequency, or null if it has no schedule.
function nextDueDate(date, frequency) {
  const time = new Date(date).getTime();
  switch (frequency) {
    case '2min': return new Date(time + 2 * MINUTE);
    case 'daily': return new Date(time + DAY);
    case 'weekly': return new Date(time + 7 * DAY);
    case 'monthly': return addMonths(date, 1);
    case 'yearly': return addMonths(date, 12);
    default: return null;
  }
}

// A DATEONLY end date covers that whole day (UTC).
function endOfDay(dateOnly) {
  return new Date(`${dateOnly}T23:59:59.999Z`);
}

module.exports = { nextDueDate, endOfDay };
