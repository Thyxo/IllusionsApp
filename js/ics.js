// iCalendar (.ics) for en enkelt aktivitet i Europe/Copenhagen.
import { addDays, MIN_PER_DAY } from './time.js';

const VTIMEZONE = [
  'BEGIN:VTIMEZONE',
  'TZID:Europe/Copenhagen',
  'X-LIC-LOCATION:Europe/Copenhagen',
  'BEGIN:DAYLIGHT',
  'TZOFFSETFROM:+0100',
  'TZOFFSETTO:+0200',
  'TZNAME:CEST',
  'DTSTART:19700329T020000',
  'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
  'END:DAYLIGHT',
  'BEGIN:STANDARD',
  'TZOFFSETFROM:+0200',
  'TZOFFSETTO:+0100',
  'TZNAME:CET',
  'DTSTART:19701025T030000',
  'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
  'END:STANDARD',
  'END:VTIMEZONE',
];

export function escapeText(s) {
  return String(s ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** Folder linjer til højst 75 oktetter (UTF-8) som RFC 5545 kræver. */
export function foldLine(line) {
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 75) return line;
  const parts = [];
  let cur = '';
  let curLen = 0;
  let limit = 75;
  for (const ch of line) {
    const len = enc.encode(ch).length;
    if (curLen + len > limit) {
      parts.push(cur);
      cur = '';
      curLen = 0;
      limit = 74; // fortsættelseslinjer starter med et mellemrum
    }
    cur += ch;
    curLen += len;
  }
  parts.push(cur);
  return parts.join('\r\n ');
}

const pad = (n) => String(n).padStart(2, '0');

function localStamp(isoDate, minutes) {
  const date = addDays(isoDate, Math.floor(minutes / MIN_PER_DAY));
  const m = minutes % MIN_PER_DAY;
  return `${date.replace(/-/g, '')}T${pad(Math.floor(m / 60))}${pad(m % 60)}00`;
}

function utcStamp(d = new Date()) {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * act: normaliseret aktivitet { id, dato, s, e, titel, ... }
 * opts: { location, description, url, now }
 */
export function buildIcs(act, { location = '', description = '', url = '', now = new Date() } = {}) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ILLUSIONS 2026//Festivalprogram//DA',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...VTIMEZONE,
    'BEGIN:VEVENT',
    `UID:${act.id}@illusions2026`,
    `DTSTAMP:${utcStamp(now)}`,
    `DTSTART;TZID=Europe/Copenhagen:${localStamp(act.dato, act.s)}`,
    `DTEND;TZID=Europe/Copenhagen:${localStamp(act.dato, Math.max(act.e, act.s + 1))}`,
    `SUMMARY:${escapeText(act.titel)}`,
  ];
  if (location) lines.push(`LOCATION:${escapeText(location)}`);
  if (description) lines.push(`DESCRIPTION:${escapeText(description)}`);
  if (url) lines.push(`URL:${url}`);
  lines.push(
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeText(act.titel)}`,
    'TRIGGER:-PT15M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  );
  return lines.map(foldLine).join('\r\n') + '\r\n';
}
