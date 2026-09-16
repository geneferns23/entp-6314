// All dates in this module are plain objects: { year, month, day }.
// month is 1-12 (January = 1). This avoids the classic bug where
// `new Date("YYYY-MM-DD")` parses as UTC and can show the previous day
// in US time zones -- we never build dates from strings here.

const MONTHS_PER_CYCLE = {
  monthly: 1,
  quarterly: 3,
  annual: 12,
};

function getMonthsPerCycle(frequency) {
  const months = MONTHS_PER_CYCLE[frequency];
  if (!months) {
    throw new Error(`Unknown billing frequency: ${frequency}`);
  }
  return months;
}

// Number of days in a given (year, month), month 1-12.
// Date.UTC(year, month, 0) lands on "day 0" of the given month,
// which JavaScript normalizes to the last day of the previous month --
// i.e. the last day of the month we actually asked about.
function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

// Adds monthsToAdd whole months to a date, always counted from that same
// starting date (never compounding from a previous result). If the target
// month is shorter than the original day, the day is clamped to the
// target month's last day (e.g. Jan 31 + 1 month = Feb 28 or 29).
function addMonths(date, monthsToAdd) {
  const totalMonths = date.year * 12 + (date.month - 1) + monthsToAdd;
  const year = Math.floor(totalMonths / 12);
  const month = (totalMonths % 12) + 1;
  const day = Math.min(date.day, daysInMonth(year, month));
  return { year, month, day };
}

function toUTCTimestamp(date) {
  return Date.UTC(date.year, date.month - 1, date.day);
}

function timestampToDate(timestamp) {
  const d = new Date(timestamp);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

// Finds the first occurrence of anchor + (cycle length x k) that falls on
// or after today, counting every cycle from the anchor itself (never from
// the previously computed renewal).
export function getNextRenewalDate(anchor, frequency, today) {
  const monthsPerCycle = getMonthsPerCycle(frequency);
  const todayTimestamp = toUTCTimestamp(today);
  let k = 0;
  let candidate = anchor;
  while (toUTCTimestamp(candidate) < todayTimestamp) {
    k += 1;
    candidate = addMonths(anchor, monthsPerCycle * k);
  }
  return candidate;
}

export function getDaysAway(date, today) {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.round((toUTCTimestamp(date) - toUTCTimestamp(today)) / millisecondsPerDay);
}

export function getRenewalStatus(daysAway) {
  if (daysAway <= 7) {
    return 'Renewing soon';
  }
  if (daysAway <= 30) {
    return 'Coming up';
  }
  return 'Later';
}

// Only call this when a notice period is set. Returns the cancel-by date,
// or deadlinePassed: true if that date has already gone by even though
// the renewal itself hasn't happened yet.
export function getCancelByInfo(nextRenewal, noticeDays, today) {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const cancelByTimestamp = toUTCTimestamp(nextRenewal) - noticeDays * millisecondsPerDay;
  const deadlinePassed = cancelByTimestamp < toUTCTimestamp(today);
  return {
    date: deadlinePassed ? null : timestampToDate(cancelByTimestamp),
    deadlinePassed,
  };
}

// Splits a "YYYY-MM-DD" string (e.g. from an <input type="date">) into a
// date object by hand, since new Date("YYYY-MM-DD") parses as UTC and can
// display as the previous day in US time zones.
export function parseISODate(isoString) {
  const [year, month, day] = isoString.split('-').map(Number);
  return { year, month, day };
}

export function formatISODate(date) {
  const month = String(date.month).padStart(2, '0');
  const day = String(date.day).padStart(2, '0');
  return `${date.year}-${month}-${day}`;
}

// Sums the cost of every subscription whose next renewal (from today)
// falls within the next 0-30 days, counting each subscription once.
// subscriptions: array of { cost, frequency, anchor }.
export function getUpcomingRenewalsTotal(subscriptions, today) {
  let total = 0;
  for (const subscription of subscriptions) {
    const nextRenewal = getNextRenewalDate(subscription.anchor, subscription.frequency, today);
    const daysAway = getDaysAway(nextRenewal, today);
    if (daysAway >= 0 && daysAway <= 30) {
      total += subscription.cost;
    }
  }
  return total;
}
