// Tid og formatering. Alle tider i programmet er lokale (Europe/Copenhagen).
export const TZ = 'Europe/Copenhagen';
export const DAY_BREAK = 5 * 60; // før kl. 05 hører til foregående festivaldag
export const MIN_PER_DAY = 24 * 60;

const partsFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

/** Kalenderdato og minutter siden midnat i København for et tidspunkt. */
export function cphParts(date = new Date()) {
  const p = {};
  for (const part of partsFmt.formatToParts(date)) p[part.type] = part.value;
  const hour = Number(p.hour) % 24;
  return { date: `${p.year}-${p.month}-${p.day}`, minutes: hour * 60 + Number(p.minute) };
}

/** "HH:MM" -> minutter siden midnat. */
export function toMin(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number);
  return h * 60 + (m || 0);
}

/** Start og slut som minutter på festivaldagen. Slut efter midnat > 1440. */
export function spanOf(start, slut) {
  let s = toMin(start);
  if (s < DAY_BREAK) s += MIN_PER_DAY;
  let e = toMin(slut);
  if (e < s) e += MIN_PER_DAY;
  return { s, e };
}

/** Antal dage mellem to ISO-datoer (b - a). */
export function dayDiff(a, b) {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000);
}

export function addDays(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
}

const pad = (n) => String(n).padStart(2, '0');

/** Minutter -> "20.15" (dansk notation). */
export function fmtTime(min) {
  const m = ((min % MIN_PER_DAY) + MIN_PER_DAY) % MIN_PER_DAY;
  return `${pad(Math.floor(m / 60))}.${pad(m % 60)}`;
}

/** Minutter -> "20:15" (til datoer/ics). */
export function hhmm(min) {
  const m = ((min % MIN_PER_DAY) + MIN_PER_DAY) % MIN_PER_DAY;
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
}

export function fmtDuration(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (!h) return `${m} min`;
  const hs = h === 1 ? '1 time' : `${h} timer`;
  return m ? `${hs} ${m} min` : hs;
}

/** Kort relativ tid: "12 min", "1 t 5 min". */
export function fmtShort(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (!h) return `${m} min`;
  return m ? `${h} t ${m} min` : `${h} t`;
}

const MONTHS = ['januar', 'februar', 'marts', 'april', 'maj', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'december'];

export function fmtDate(iso, { short = false } = {}) {
  const [, m, d] = iso.split('-').map(Number);
  const month = MONTHS[m - 1];
  return `${d}. ${short ? month.slice(0, 3) : month}`;
}

/**
 * "Nu" i København. Kan overstyres med ?nu=2026-10-16T20:20 (til test og demo);
 * den overstyrede tid går videre i realtid fra sideindlæsning.
 */
const loadedAt = Date.now();
let override = null;
try {
  const q = new URLSearchParams(globalThis.location?.search || '').get('nu');
  const m = q && /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})$/.exec(q);
  if (m) override = { date: m[1], minutes: Number(m[2]) * 60 + Number(m[3]) };
} catch { /* ingen location i node */ }

export function nowCph() {
  if (!override) return cphParts(new Date());
  const elapsed = Math.floor((Date.now() - loadedAt) / 60000);
  const total = override.minutes + elapsed;
  return { date: addDays(override.date, Math.floor(total / MIN_PER_DAY)), minutes: total % MIN_PER_DAY };
}

/** Festivaldag (dato) og minutter på den dag – efter midnat tæller som dagen før. */
export function festivalClock(now = nowCph()) {
  if (now.minutes < DAY_BREAK) return { date: addDays(now.date, -1), minutes: now.minutes + MIN_PER_DAY };
  return { ...now };
}
