const MONTHS = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

export function pad2(n) {
  return String(n).padStart(2, "0");
}

export function toISODate(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function normalizeYear(y) {
  if (y.length === 2) return 2000 + parseInt(y, 10);
  return parseInt(y, 10);
}

/**
 * Finds the first date-like mention in `text` and resolves it to an ISO
 * date, rolling to next year when a year isn't given and the month/day has
 * already passed relative to `today`. Returns { iso, matchText } or null.
 */
export function findDate(text, today = new Date()) {
  // "Month DD, YYYY" or "Month DD" (Month name, optionally abbreviated)
  const monthNamePattern =
    /\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s*(\d{4}))?\b/i;

  const monthMatch = text.match(monthNamePattern);
  if (monthMatch) {
    const month = MONTHS[monthMatch[1].toLowerCase()];
    const day = parseInt(monthMatch[2], 10);
    if (month !== undefined && day >= 1 && day <= 31) {
      const year = monthMatch[3] ? parseInt(monthMatch[3], 10) : today.getFullYear();
      let d = new Date(year, month, day);
      if (!monthMatch[3] && d < stripTime(today)) {
        d = new Date(year + 1, month, day);
      }
      return { iso: toISODate(d), matchText: monthMatch[0] };
    }
  }

  // Numeric "MM/DD" or "MM/DD/YYYY" or "MM-DD-YYYY" (assumes US MM/DD order)
  const numericPattern = /\b(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?\b/;
  const numMatch = text.match(numericPattern);
  if (numMatch) {
    const month = parseInt(numMatch[1], 10) - 1;
    const day = parseInt(numMatch[2], 10);
    if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
      const year = numMatch[3] ? normalizeYear(numMatch[3]) : today.getFullYear();
      let d = new Date(year, month, day);
      if (!numMatch[3] && d < stripTime(today)) {
        d = new Date(year + 1, month, day);
      }
      return { iso: toISODate(d), matchText: numMatch[0] };
    }
  }

  return null;
}

function stripTime(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
