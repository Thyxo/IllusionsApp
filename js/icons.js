// Simple SVG-ikoner (24×24, streg = currentColor).
const P = {
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  list: '<path d="M9 6.5h11M9 12h11M9 17.5h11"/><circle cx="4.75" cy="6.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="4.75" cy="12" r="1.1" fill="currentColor" stroke="none"/><circle cx="4.75" cy="17.5" r="1.1" fill="currentColor" stroke="none"/>',
  filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
  star: '<path d="M12 3.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" stroke-linejoin="round"/>',
  starFill: '<path d="M12 3.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" fill="currentColor" stroke-linejoin="round"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5"/><circle cx="12" cy="7.8" r="1.1" fill="currentColor" stroke="none"/>',
  program: '<path d="M5 4.5h14M5 19.5h14"/><rect x="4" y="8" width="7" height="8" rx="1.5"/><rect x="13" y="8" width="7" height="4.5" rx="1.5"/>',
  pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>',
  route: '<circle cx="6" cy="18" r="2.2"/><circle cx="18" cy="6" r="2.2"/><path d="M8.2 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.8"/>',
  walk: '<circle cx="13" cy="4.5" r="1.8"/><path d="M10 21l2-6 3 3v3M8 12.5l2.5-4.5 4 1.5 2 3.5M12 15l-1.5-4"/>',
  share: '<path d="M12 15V3.5M8 7.5l4-4 4 4"/><path d="M6 11H5v9.5h14V11h-1"/>',
  calPlus: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4M12 13v5M9.5 15.5h5"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  chevron: '<path d="M6 9l6 6 6-6"/>',
  warn: '<path d="M12 4l9 16H3z" stroke-linejoin="round"/><path d="M12 10v4.5"/><circle cx="12" cy="17.3" r="1" fill="currentColor" stroke="none"/>',
  offline: '<path d="M2.5 8.5a14 14 0 0 1 19 0M5.5 12a9.5 9.5 0 0 1 13 0M8.8 15.3a5 5 0 0 1 6.4 0"/><circle cx="12" cy="19" r="1.2" fill="currentColor" stroke="none"/><path d="M3 3l18 18"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L20 20"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/>',
  phone: '<path d="M6.5 3.5h3l1.5 4.5-2 1.5a11 11 0 0 0 5.5 5.5l1.5-2 4.5 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 4.5 5.5a2 2 0 0 1 2-2z" stroke-linejoin="round"/>',
  mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M4 7l8 6 8-6"/>',
  people: '<circle cx="9" cy="8" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><circle cx="16.5" cy="9" r="2.3"/><path d="M15.5 14.2a4.5 4.5 0 0 1 5 4.8"/>',
  door: '<path d="M6 20.5V4.5h9v16M3.5 20.5h17M15 4.5l4 1.5v14.5"/><circle cx="12.3" cy="12.5" r=".9" fill="currentColor" stroke="none"/>',
  sparkle: '<path d="M12 3c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7z" stroke-linejoin="round"/>',
  download: '<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19.5h14"/>',
  // Adgangstyper
  wristband: '<rect x="2.5" y="8" width="19" height="8" rx="4"/><rect x="9" y="9.6" width="6" height="4.8" rx="1"/>',
  free: '<circle cx="12" cy="12" r="8.5"/><path d="M8 12.3l2.7 2.7L16.2 9.5"/>',
  ticket: '<path d="M3.5 7h17v3.2a1.8 1.8 0 0 0 0 3.6V17h-17v-3.2a1.8 1.8 0 0 0 0-3.6z" stroke-linejoin="round"/><path d="M14.5 7.5v1.5M14.5 11.25v1.5M14.5 15v1.5"/>',
  ticketPlus: '<path d="M3.5 7h17v3.2a1.8 1.8 0 0 0 0 3.6V17h-17v-3.2a1.8 1.8 0 0 0 0-3.6z" stroke-linejoin="round"/><path d="M12 9.5v5M9.5 12h5"/>',
  question: '<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.6a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.2.9-1.2 1.7v.4"/><circle cx="12" cy="16.9" r="1" fill="currentColor" stroke="none"/>',
};

export const ACCESS_ICON = { A: 'wristband', G: 'free', B: 'ticket', '+': 'ticketPlus', '?': 'question' };

/** Returnerer SVG-markup. Dekorativ (aria-hidden) – teksten bærer betydningen. */
export function icon(name, cls = '') {
  return `<svg class="ic${cls ? ` ${cls}` : ''}" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true" focusable="false">${P[name] || ''}</svg>`;
}
