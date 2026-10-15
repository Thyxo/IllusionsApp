import DATA from '../data.js';
import {
  spanOf, dayDiff, fmtTime, fmtDuration, fmtShort, fmtDate, nowCph, festivalClock, MIN_PER_DAY,
} from './time.js';
import { layoutDay, findConflicts, conflictIds, conflictsWith, tightTransfers, isFixed } from './layout.js';
import { buildIcs } from './ics.js';
import { icon, ACCESS_ICON } from './icons.js';
import { createSheet } from './sheet.js';

const APP_VERSION = '1.0.0';

/* ------------------------------------------------------------------ Model */

const DAYS = DATA.dage.map((d, index) => ({ ...d, index }));
const DAY_BY_ID = Object.fromEntries(DAYS.map((d) => [d.id, d]));
const FIRST_DATE = DAYS[0].dato;
const STEDER = DATA.steder;
const ACCESS = DATA.adgang;
const ACCESS_KEYS = ['A', 'G', 'B', '+', '?'];
const ACC_CLASS = { A: 'A', G: 'G', B: 'B', '+': 'P', '?': 'Q' };
const AUDIENCE = { alle: 'For alle', børn: 'Børn', voksne: 'Voksne' };
const TABS = ['program', 'nu', 'mit', 'info'];
const TAB_TITLE = { program: 'Program', nu: 'Nu og næste', mit: 'Mit program', info: 'Praktisk info' };

const ACTS = DATA.aktiviteter
  .filter((raw) => DAY_BY_ID[raw.dag])
  .map((raw) => {
    const day = DAY_BY_ID[raw.dag];
    const { s, e } = spanOf(raw.start, raw.slut);
    return {
      ...raw, s, e, dato: day.dato, dayIndex: day.index,
      abs: day.index * MIN_PER_DAY + s, absEnd: day.index * MIN_PER_DAY + e,
    };
  })
  .sort((a, b) => a.abs - b.abs || a.absEnd - b.absEnd || a.titel.localeCompare(b.titel, 'da'));
const ACT_BY_ID = new Map(ACTS.map((a) => [a.id, a]));

(function validate() {
  const seen = new Set();
  for (const a of DATA.aktiviteter) {
    if (seen.has(a.id)) console.warn('Dobbelt id i data.js:', a.id);
    seen.add(a.id);
    if (!DAY_BY_ID[a.dag]) console.warn('Ukendt dag:', a.id, a.dag);
    if (!STEDER[a.sted]) console.warn('Ukendt sted:', a.id, a.sted);
    if (!ACCESS[a.adgang]) console.warn('Ukendt adgang:', a.id, a.adgang);
  }
})();

/* ---------------------------------------------------------------- Helpers */

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = (sel, root = document) => root.querySelector(sel);
const norm = (s) => String(s || '').toLocaleLowerCase('da').normalize('NFD').replace(/[̀-ͯ]/g, '');
const byTime = (a, b) => a.abs - b.abs || a.absEnd - b.absEnd;
const pad2 = (n) => String(n).padStart(2, '0');

function placeName(a) {
  const st = STEDER[a.sted];
  const name = st?.navn || a.sted;
  return a.lokale ? `${a.lokale}, ${name}` : name;
}
const placeShort = (a) => STEDER[a.sted]?.kort || STEDER[a.sted]?.navn || a.sted;

function mapsQuery(stedId) {
  const st = STEDER[stedId];
  if (!st) return `${stedId}, Horsens`;
  if (st.maps) return st.maps;
  const name = st.soeg || st.navn;
  if (st.adresse) return /horsens/i.test(st.adresse) ? `${name}, ${st.adresse}` : `${name}, ${st.adresse}, Horsens`;
  return /horsens/i.test(name) ? name : `${name}, Horsens`;
}
const mapsUrl = (q) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
const routeUrl = (dest, origin) => `https://www.google.com/maps/dir/?api=1${origin ? `&origin=${encodeURIComponent(origin)}` : ''}&destination=${encodeURIComponent(dest)}&travelmode=walking`;

const timeText = (a) => a.visTid || `${fmtTime(a.s)}–${fmtTime(a.e)}`;
const accessName = (k) => (k === '?' ? 'Tjek ved indtjekning' : ACCESS[k]?.navn || k);
const dayLabel = (a) => `${DAY_BY_ID[a.dag].navn.toLowerCase()} ${fmtDate(a.dato)}`;

function accessTag(k, { plainName = false } = {}) {
  const label = plainName ? ACCESS[k]?.navn || k : accessName(k);
  return `<span class="tag acc-${ACC_CLASS[k]}">${icon(ACCESS_ICON[k])}<span>${esc(label)}</span></span>`;
}

/** Ekstra tekst til skærmlæsere – den synlige titel står først i knappens navn. */
function srFor(a, { conflict = false, extra = '' } = {}) {
  const bits = [dayLabel(a), `kl. ${timeText(a)}`, placeName(a), accessName(a.adgang)];
  if (a.maalgruppe !== 'alle') bits.push(AUDIENCE[a.maalgruppe]);
  if (state.stars.has(a.id)) bits.push('i mit program');
  if (conflict) bits.push('overlapper en anden aktivitet i dit program');
  if (extra) bits.push(extra);
  return `<span class="sr-only">, ${esc(bits.join(', '))}</span>`;
}

function clockNow() {
  const fc = festivalClock(nowCph());
  const dayIndex = dayDiff(FIRST_DATE, fc.date);
  return { ...fc, dayIndex, abs: dayIndex * MIN_PER_DAY + fc.minutes, dayId: DAYS[dayIndex]?.id || null };
}

/* ------------------------------------------------------------------ State */

const LS_KEY = 'illusions2026.v1';
function loadSaved() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch { return {}; }
}
const saved = loadSaved();
const sf = saved.filters || {};

const state = {
  tab: 'program',
  day: clockNow().dayId || (DAY_BY_ID[saved.day] ? saved.day : DAYS[0].id),
  view: saved.view === 'liste' ? 'liste' : 'kalender',
  alldayOpen: saved.alldayOpen !== false,
  stars: new Set((saved.stars || []).filter((id) => ACT_BY_ID.has(id))),
  filters: {
    adgang: new Set((sf.adgang || []).filter((k) => ACCESS[k])),
    maalgruppe: AUDIENCE[sf.maalgruppe] ? sf.maalgruppe : 'alle',
    steder: new Set((sf.steder || []).filter((k) => STEDER[k])),
    kunMine: !!sf.kunMine,
    q: typeof sf.q === 'string' ? sf.q : '',
  },
};

function save() {
  const f = state.filters;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({
      stars: [...state.stars], day: state.day, view: state.view, alldayOpen: state.alldayOpen,
      filters: { adgang: [...f.adgang], maalgruppe: f.maalgruppe, steder: [...f.steder], kunMine: f.kunMine, q: f.q },
    }));
  } catch { /* privat tilstand eller fuld lagring – appen virker stadig */ }
}

function matches(a, f = state.filters) {
  if (f.adgang.size && !f.adgang.has(a.adgang)) return false;
  if (f.maalgruppe !== 'alle' && a.maalgruppe !== f.maalgruppe && a.maalgruppe !== 'alle') return false;
  if (f.steder.size && !f.steder.has(a.sted)) return false;
  if (f.kunMine && !state.stars.has(a.id)) return false;
  if (f.q.trim()) {
    const q = norm(f.q.trim());
    if (!norm(`${a.titel} ${a.artist || ''}`).includes(q)) return false;
  }
  return true;
}

function activeFilterCount(f = state.filters) {
  return f.adgang.size + f.steder.size + (f.maalgruppe !== 'alle' ? 1 : 0) + (f.kunMine ? 1 : 0) + (f.q.trim() ? 1 : 0);
}

const starredOn = (dayId) => ACTS.filter((a) => a.dag === dayId && state.stars.has(a.id));

/* -------------------------------------------------------------- Elementer */

const els = {
  app: $('#app'),
  title: $('#tab-title'),
  btnView: $('#btn-view'),
  btnFilter: $('#btn-filter'),
  daytabs: $('#daytabs'),
  chips: $('#chips'),
  offline: $('#offline'),
  content: $('#content'),
  nav: $('#bottomnav'),
  toast: $('#toast'),
};
const sheet = createSheet($('#sheet-root'), els.app);

/* -------------------------------------------------------------- Topbar */

function renderTopbar() {
  const t = state.tab;
  els.title.textContent = TAB_TITLE[t];
  document.title = t === 'program' ? 'ILLUSIONS 2026' : `${TAB_TITLE[t]} · ILLUSIONS 2026`;

  const showView = t === 'program' || t === 'mit';
  els.btnView.hidden = !showView;
  const toList = state.view === 'kalender';
  els.btnView.innerHTML = icon(toList ? 'list' : 'calendar');
  els.btnView.setAttribute('aria-label', toList ? 'Vis som liste' : 'Vis som kalender');
  els.btnView.title = toList ? 'Vis som liste' : 'Vis som kalender';

  els.btnFilter.hidden = t !== 'program';
  const n = activeFilterCount();
  els.btnFilter.innerHTML = `${icon('filter')}${n ? `<span class="badge" aria-hidden="true">${n}</span>` : ''}`;
  els.btnFilter.setAttribute('aria-label', n ? `Filtre, ${n} aktive` : 'Filtre');
  els.btnFilter.classList.toggle('is-active', n > 0);

  els.daytabs.hidden = !showView;
  if (showView) renderDayTabs();
  renderChips();
}

function renderDayTabs() {
  const today = clockNow().dayId;
  els.daytabs.innerHTML = DAYS.map((d) => {
    const sel = d.id === state.day;
    const mine = starredOn(d.id);
    const clash = findConflicts(mine).length;
    const label = [`${d.navn} ${fmtDate(d.dato)}`];
    if (d.id === today) label.push('i dag');
    if (mine.length) label.push(`${mine.length} i mit program`);
    if (clash) label.push(`${clash} overlap`);
    return `<button type="button" role="tab" class="daytab${sel ? ' is-active' : ''}${d.id === today ? ' is-today' : ''}"
      id="daytab-${d.id}" data-day="${d.id}" aria-selected="${sel}" aria-controls="content" tabindex="${sel ? 0 : -1}"
>
      <span class="daytab-name">${esc(d.kort)}</span>
      <span class="daytab-date">${d.id === today ? 'I dag' : esc(fmtDate(d.dato, { short: true }))}</span>
      <span class="sr-only">, ${esc(label.join(', '))}</span>
      ${mine.length ? `<span class="daytab-dot${clash ? ' is-clash' : ''}" aria-hidden="true"></span>` : ''}
    </button>`;
  }).join('');
}

function renderChips() {
  const f = state.filters;
  const show = state.tab === 'program' && activeFilterCount() > 0;
  els.chips.hidden = !show;
  if (!show) { els.chips.innerHTML = ''; return; }
  const chips = [];
  for (const k of f.adgang) chips.push([`adgang:${k}`, ACCESS[k].navn]);
  if (f.maalgruppe !== 'alle') chips.push([`maal:${f.maalgruppe}`, AUDIENCE[f.maalgruppe]]);
  for (const k of f.steder) chips.push([`sted:${k}`, STEDER[k].kort || STEDER[k].navn]);
  if (f.kunMine) chips.push(['mine:1', 'Kun mit program']);
  if (f.q.trim()) chips.push(['q:1', `“${f.q.trim()}”`]);
  els.chips.innerHTML = `${chips.map(([key, label]) => `<button type="button" class="chip" data-chip="${esc(key)}" aria-label="Fjern filter: ${esc(label)}"><span>${esc(label)}</span>${icon('close')}</button>`).join('')}<button type="button" class="chip chip--reset" data-act="reset-filters">Nulstil</button>`;
}

function renderNav() {
  const count = state.stars.size;
  const clashes = DAYS.reduce((n, d) => n + findConflicts(starredOn(d.id)).length, 0);
  const items = [
    ['program', 'program', 'Program'],
    ['nu', 'clock', 'Nu'],
    ['mit', 'star', 'Mit program'],
    ['info', 'info', 'Info'],
  ];
  els.nav.innerHTML = items.map(([tab, ic, label]) => {
    const active = state.tab === tab;
    let badge = '';
    let aria = label;
    if (tab === 'mit' && count) {
      badge = `<span class="badge${clashes ? ' badge--clash' : ''}" aria-hidden="true">${clashes ? '!' : count}</span>`;
      aria = `${label}, ${count} aktiviteter${clashes ? `, ${clashes} overlap` : ''}`;
    }
    return `<button type="button" class="navbtn${active ? ' is-active' : ''}" data-tab="${tab}" ${active ? 'aria-current="page"' : ''} aria-label="${esc(aria)}">
      <span class="navbtn-ic">${icon(active && tab === 'mit' ? 'starFill' : ic)}${badge}</span><span class="navbtn-label">${label}</span></button>`;
  }).join('');
}

/* ------------------------------------------------------------ Kalender */

const HOUR_PX = 80;
const PX = HOUR_PX / 60;
const CAL_START = 8 * 60;
const CAL_END = 26 * 60;
const TOP_PAD = 14;
const MIN_H = 46;
const MIN_DUR = Math.ceil(MIN_H / PX);
const RAIL_PX = 46;

const yOf = (min) => TOP_PAD + (Math.min(Math.max(min, CAL_START), CAL_END) - CAL_START) * PX;

function allDayHtml(list, { conflicts = new Set(), title = 'Hele dagen' } = {}) {
  if (!list.length) return '';
  const open = state.alldayOpen;
  return `<section class="allday" aria-label="${esc(title)}">
    <button type="button" class="allday-toggle" data-act="toggle-allday" aria-expanded="${open}">
      <span class="allday-title">${esc(title)}</span><span class="count">${list.length}</span>${icon('chevron', 'chev')}
    </button>
    <div class="allday-grid"${open ? '' : ' hidden'}>
      ${list.map((a) => `<button type="button" class="adc acc-${ACC_CLASS[a.adgang]}${state.stars.has(a.id) ? ' is-star' : ''}${conflicts.has(a.id) ? ' is-conflict' : ''}" data-open="${a.id}">
        <span class="adc-title">${state.stars.has(a.id) ? icon('starFill', 'mini-star') : ''}${esc(a.titel)}</span>${srFor(a, { conflict: conflicts.has(a.id) })}
        <span class="adc-meta">${icon(ACCESS_ICON[a.adgang])}<span>${esc(timeText(a))}</span></span>
        <span class="adc-meta adc-place">${esc(placeShort(a))}</span>
      </button>`).join('')}
    </div>
  </section>`;
}

function calendarHtml(list, { conflicts = new Set(), dayId = state.day } = {}) {
  const allDay = list.filter((a) => a.heleDagen);
  const timed = list.filter((a) => !a.heleDagen);
  const layout = layoutDay(timed, { minDur: MIN_DUR, isWindow: (a) => !!a.aabent });
  const height = yOf(CAL_END) + 18;

  let hours = '';
  for (let m = CAL_START; m <= CAL_END; m += 60) {
    hours += `<div class="hr" style="top:${yOf(m)}px"><span>${pad2((m / 60) % 24)}</span></div>`;
    if (m < CAL_END) hours += `<div class="hr hr--half" style="top:${yOf(m + 30)}px"></div>`;
  }

  const blocks = timed.map((a) => {
    const L = layout.get(a.id);
    const top = yOf(a.s);
    const h = Math.max(MIN_H, yOf(a.e) - top) - 2;
    const share = L.span / L.cols;
    const railW = L.rails * RAIL_PX;
    const cls = [
      'ev', `acc-${ACC_CLASS[a.adgang]}`,
      L.rail ? 'is-rail' : '',
      !L.rail && h < 62 ? 'is-short' : '', !L.rail && h >= 92 ? 'is-tall' : '',
      !L.rail && (share <= 0.34 || (railW && share <= 0.5)) ? 'is-narrow' : '',
      state.stars.has(a.id) ? 'is-star' : '',
      conflicts.has(a.id) ? 'is-conflict' : '',
      a.aabent ? 'is-open' : '',
    ].filter(Boolean).join(' ');
    let style = `top:${top}px;height:${h}px;`;
    if (L.rail) style += `left:${L.col * RAIL_PX + 1}px;width:${RAIL_PX - 3}px`;
    else if (railW) style += `left:calc(${railW + 1}px + (100% - ${railW}px) * ${L.col / L.cols});width:calc((100% - ${railW}px) * ${share} - 3px)`;
    else style += `left:calc(${(L.col / L.cols) * 100}% + 1px);width:calc(${share * 100}% - 3px)`;
    return `<button type="button" class="${cls}" style="${style}" data-open="${a.id}">
      <span class="ev-title">${conflicts.has(a.id) ? icon('warn', 'mini-warn') : ''}${state.stars.has(a.id) ? icon('starFill', 'mini-star') : ''}${esc(a.titel)}</span>${srFor(a, { conflict: conflicts.has(a.id) })}
      <span class="ev-meta">${icon(ACCESS_ICON[a.adgang])}<span>${esc(timeText(a))}</span></span>
      <span class="ev-meta ev-place">${esc(placeShort(a))}</span>
    </button>`;
  }).join('');

  const now = clockNow();
  const showNow = now.dayId === dayId && now.minutes >= CAL_START && now.minutes <= CAL_END;
  const nowLine = `<div class="nowline" id="nowline" style="top:${yOf(now.minutes)}px"${showNow ? '' : ' hidden'} aria-hidden="true"><span>${fmtTime(now.minutes)}</span></div>`;

  return `${allDayHtml(allDay, { conflicts })}
    <div class="cal" style="height:${height}px">
      ${hours}
      <div class="cal-events">${blocks}</div>
      ${nowLine}
    </div>`;
}

/* ---------------------------------------------------------------- Liste */

function itemHtml(a, { conflict = false, note = '' } = {}) {
  const starred = state.stars.has(a.id);
  const tags = [accessTag(a.adgang)];
  if (a.maalgruppe !== 'alle') tags.push(`<span class="tag tag--plain">${icon('people')}<span>${AUDIENCE[a.maalgruppe]}</span></span>`);
  if (a.aabent) tags.push(`<span class="tag tag--plain">${icon('door')}<span>Kom og gå</span></span>`);
  if (conflict) tags.push(`<span class="tag tag--danger">${icon('warn')}<span>Overlapper</span></span>`);
  return `<li class="item acc-${ACC_CLASS[a.adgang]}${starred ? ' is-star' : ''}${conflict ? ' is-conflict' : ''}">
    <button type="button" class="item-main" data-open="${a.id}">
      <span class="item-time"><b>${fmtTime(a.s)}</b><span>${fmtTime(a.e)}</span></span>
      <span class="item-body">
        <span class="item-title">${esc(a.titel)}</span>${srFor(a, { conflict })}
        <span class="item-sub">${esc(placeName(a))}${a.visTid ? ` · ${esc(a.visTid)}` : ''}${note ? ` · ${esc(note)}` : ''}</span>
        <span class="item-tags">${tags.join('')}</span>
      </span>
    </button>
    <button type="button" class="star-btn${starred ? ' is-on' : ''}" data-star="${a.id}" aria-pressed="${starred}" aria-label="${starred ? 'Fjern' : 'Tilføj'} ${esc(a.titel)} ${starred ? 'fra' : 'til'} mit program">${icon(starred ? 'starFill' : 'star')}</button>
  </li>`;
}

function listHtml(list, { conflicts = new Set() } = {}) {
  const allDay = list.filter((a) => a.heleDagen);
  const timed = list.filter((a) => !a.heleDagen);
  let html = '';
  if (allDay.length) {
    html += `<section class="group"><h2 class="group-h">Hele dagen</h2><ul class="items">${allDay.map((a) => itemHtml(a)).join('')}</ul></section>`;
  }
  const groups = new Map();
  for (const a of timed) {
    const h = Math.floor(a.s / 60);
    if (!groups.has(h)) groups.set(h, []);
    groups.get(h).push(a);
  }
  for (const [h, items] of groups) {
    html += `<section class="group" data-hour="${h}"><h2 class="group-h">kl. ${pad2(h % 24)}.00</h2><ul class="items">${items.map((a) => itemHtml(a, { conflict: conflicts.has(a.id) })).join('')}</ul></section>`;
  }
  return html;
}

/* -------------------------------------------------------------- Skærme */

function emptyHtml(title, text, action = '') {
  return `<div class="empty">${icon('sparkle', 'empty-ic')}<h2>${esc(title)}</h2><p>${esc(text)}</p>${action}</div>`;
}

function renderProgram() {
  const day = DAY_BY_ID[state.day];
  const all = ACTS.filter((a) => a.dag === state.day);
  const list = all.filter((a) => matches(a));
  const heading = `<h2 class="sr-only">Program ${esc(day.navn)} ${esc(fmtDate(day.dato))}</h2>`;
  if (!list.length) {
    return heading + emptyHtml('Ingen aktiviteter', `Ingen aktiviteter ${day.navn.toLowerCase()} matcher dine filtre.`,
      '<button type="button" class="btn btn--primary" data-act="reset-filters">Nulstil filtre</button>');
  }
  const mine = conflictIds(ACTS.filter((a) => a.dag === state.day && state.stars.has(a.id)));
  const body = state.view === 'kalender' ? calendarHtml(list, { conflicts: mine }) : listHtml(list, { conflicts: mine });
  return heading + body;
}

function renderMine() {
  const day = DAY_BY_ID[state.day];
  if (!state.stars.size) {
    return emptyHtml('Dit program er tomt', 'Tryk på stjernen ved en aktivitet for at lægge den i dit program. Så får du også besked, hvis noget overlapper.',
      '<button type="button" class="btn btn--primary" data-tab="program">Gå til programmet</button>');
  }
  const list = starredOn(state.day).sort(byTime);
  if (!list.length) {
    const others = DAYS.filter((d) => starredOn(d.id).length);
    return emptyHtml(`Intet i dit program ${day.navn.toLowerCase()}`, 'Du har ikke stjernemarkeret noget denne dag.',
      `<div class="empty-actions">${others.map((d) => `<button type="button" class="btn" data-day="${d.id}">${esc(d.navn)} (${starredOn(d.id).length})</button>`).join('')}
      <button type="button" class="btn btn--primary" data-tab="program">Se programmet</button></div>`);
  }
  const conflicts = findConflicts(list);
  const cids = conflictIds(list);
  const fixed = list.filter(isFixed);
  const summary = `<p class="mine-summary">${list.length} ${list.length === 1 ? 'aktivitet' : 'aktiviteter'}${fixed.length ? ` · kl. ${fmtTime(Math.min(...fixed.map((a) => a.s)))}–${fmtTime(Math.max(...fixed.map((a) => a.e)))}` : ''}</p>`;
  const banners = conflicts.map((c) => `<div class="alert alert--danger">${icon('warn')}<p><strong>${esc(c.a.titel)}</strong> og <strong>${esc(c.b.titel)}</strong> overlapper kl. ${fmtTime(c.s)}.</p></div>`).join('');
  const heading = `<h2 class="sr-only">Mit program ${esc(day.navn)}</h2>`;

  if (state.view === 'kalender') return heading + `<div class="mine-top">${summary}${banners}</div>` + calendarHtml(list, { conflicts: cids });

  const transfers = new Map(tightTransfers(list).map((t) => [t.to.id, t]));
  const allDay = list.filter((a) => a.heleDagen);
  const timed = list.filter((a) => !a.heleDagen);
  let html = `<div class="mine-top">${summary}${banners}</div>`;
  if (allDay.length) html += `<section class="group"><h2 class="group-h">Hele dagen</h2><ul class="items">${allDay.map((a) => itemHtml(a)).join('')}</ul></section>`;
  html += '<section class="group"><h2 class="group-h">Tidsplan</h2><ul class="items">';
  for (const a of timed) {
    const t = transfers.get(a.id);
    if (t) {
      const from = mapsQuery(t.from.sted);
      const to = mapsQuery(t.to.sted);
      const txt = t.gap <= 0
        ? `Ingen tid til at nå fra ${placeShort(t.from)} til ${placeShort(t.to)}`
        : `Kun ${t.gap} min til at nå fra ${placeShort(t.from)} til ${placeShort(t.to)}`;
      html += `<li class="transfer">${icon('walk')}<span>${esc(txt)}</span><a class="transfer-link" href="${esc(routeUrl(to, from))}" target="_blank" rel="noopener" data-maps="${esc(to)}">Rute</a></li>`;
    }
    html += itemHtml(a, { conflict: cids.has(a.id) });
  }
  html += '</ul></section>';
  return heading + html;
}

function countdownParts(mins) {
  const d = Math.floor(mins / MIN_PER_DAY);
  const h = Math.floor((mins % MIN_PER_DAY) / 60);
  const m = mins % 60;
  return [[d, d === 1 ? 'dag' : 'dage'], [h, h === 1 ? 'time' : 'timer'], [m, 'min']];
}

function nowItemHtml(a, now, mode) {
  const starred = state.stars.has(a.id);
  let rel;
  let progress = '';
  if (mode === 'live') {
    const left = a.absEnd - now.abs;
    const pct = Math.round(((now.abs - a.abs) / Math.max(1, a.absEnd - a.abs)) * 100);
    rel = `slutter om ${fmtShort(left)}`;
    progress = `<span class="progress" aria-hidden="true"><span style="width:${pct}%"></span></span>`;
  } else {
    const until = a.abs - now.abs;
    rel = until < 24 * 60 && a.dayIndex === now.dayIndex ? `om ${fmtShort(until)}` : `${DAY_BY_ID[a.dag].navn.toLowerCase()}`;
  }
  return `<li class="item acc-${ACC_CLASS[a.adgang]}${starred ? ' is-star' : ''}">
    <button type="button" class="item-main" data-open="${a.id}">
      <span class="item-time"><b>${fmtTime(a.s)}</b><span>${fmtTime(a.e)}</span></span>
      <span class="item-body">
        <span class="item-title">${starred ? icon('starFill', 'mini-star') : ''}${esc(a.titel)}</span>${srFor(a, { extra: rel })}
        <span class="item-sub">${esc(placeName(a))}</span>
        <span class="item-tags">${accessTag(a.adgang)}<span class="tag tag--rel">${esc(rel)}</span></span>
        ${progress}
      </span>
    </button>
    <button type="button" class="star-btn${starred ? ' is-on' : ''}" data-star="${a.id}" aria-pressed="${starred}" aria-label="${starred ? 'Fjern' : 'Tilføj'} ${esc(a.titel)} ${starred ? 'fra' : 'til'} mit program">${icon(starred ? 'starFill' : 'star')}</button>
  </li>`;
}

function renderNow() {
  const now = clockNow();
  const first = ACTS.reduce((m, a) => Math.min(m, a.abs), Infinity);
  const last = ACTS.reduce((m, a) => Math.max(m, a.absEnd), -Infinity);
  const starFirst = (a, b) => (state.stars.has(b.id) - state.stars.has(a.id)) || byTime(a, b);

  if (now.abs < first) {
    const parts = countdownParts(first - now.abs);
    const firstAct = ACTS.find((a) => a.abs === first);
    const checkin = ACT_BY_ID.get('tor-indtjekning');
    return `<section class="now">
      <div class="countdown" role="timer" aria-label="Festivalen starter om ${parts.map(([n, u]) => `${n} ${u}`).join(' ')}">
        <p class="eyebrow">Festivalen starter om</p>
        <div class="cd-row">${parts.map(([n, u]) => `<div class="cd-box"><b>${n}</b><span>${u}</span></div>`).join('')}</div>
        <p class="cd-sub">${esc(DAY_BY_ID[firstAct.dag].navn)} ${esc(fmtDate(firstAct.dato))} kl. ${fmtTime(firstAct.s)}</p>
      </div>
      ${checkin ? `<h2 class="group-h">Første punkter</h2><ul class="items">${itemHtml(checkin)}</ul>` : ''}
    </section>`;
  }

  if (now.abs >= last) {
    return emptyHtml('Tak for i år', 'ILLUSIONS 2026 er slut. Programmet ligger stadig her, hvis du vil kigge tilbage.',
      '<button type="button" class="btn btn--primary" data-tab="program">Se programmet</button>');
  }

  const live = ACTS.filter((a) => !a.heleDagen && a.abs <= now.abs && now.abs < a.absEnd).sort(starFirst);
  const soon = ACTS.filter((a) => !a.heleDagen && a.abs > now.abs && a.abs <= now.abs + 120).sort(starFirst);
  const open = ACTS.filter((a) => a.heleDagen && a.abs <= now.abs && now.abs < a.absEnd);
  const myNext = ACTS.filter((a) => state.stars.has(a.id) && a.abs > now.abs + 120).sort(byTime)[0];
  const nextAny = !live.length && !soon.length ? ACTS.filter((a) => !a.heleDagen && a.abs > now.abs).sort(byTime)[0] : null;
  const dayName = DAYS[now.dayIndex] ? `${DAYS[now.dayIndex].navn} ${fmtDate(DAYS[now.dayIndex].dato)}` : '';

  let html = `<section class="now">
    <div class="now-head"><span>${esc(dayName)}</span><span class="now-clock" id="now-clock">kl. ${fmtTime(now.minutes)}</span></div>`;

  html += '<h2 class="group-h">Lige nu</h2>';
  html += live.length
    ? `<ul class="items">${live.map((a) => nowItemHtml(a, now, 'live')).join('')}</ul>`
    : '<p class="muted-box">Ingen aktiviteter i gang lige nu.</p>';

  html += '<h2 class="group-h">Næste 2 timer</h2>';
  if (soon.length) html += `<ul class="items">${soon.map((a) => nowItemHtml(a, now, 'soon')).join('')}</ul>`;
  else if (nextAny) html += `<p class="muted-box">Intet de næste 2 timer. Næste: <strong>${esc(nextAny.titel)}</strong> ${esc(DAY_BY_ID[nextAny.dag].navn.toLowerCase())} kl. ${fmtTime(nextAny.s)}.</p><ul class="items">${nowItemHtml(nextAny, now, 'soon')}</ul>`;
  else html += '<p class="muted-box">Intet de næste 2 timer.</p>';

  if (myNext) html += `<h2 class="group-h">Dit næste punkt</h2><ul class="items">${nowItemHtml(myNext, now, 'soon')}</ul>`;

  if (open.length) {
    html += `<h2 class="group-h">Åbent nu</h2><div class="open-grid">${open.map((a) => `<button type="button" class="adc acc-${ACC_CLASS[a.adgang]}" data-open="${a.id}">
      <span class="adc-title">${esc(a.titel)}</span>${srFor(a)}<span class="adc-meta">${icon(ACCESS_ICON[a.adgang])}<span>til ${fmtTime(a.e)}</span></span><span class="adc-meta adc-place">${esc(placeShort(a))}</span></button>`).join('')}</div>`;
  }
  return `${html}</section>`;
}

/* ----------------------------------------------------------------- Info */

let deferredInstall = null;
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

function accordion(id, title, ic, body, open = false) {
  return `<details class="acc" id="info-${id}"${open ? ' open' : ''}>
    <summary>${icon(ic)}<span>${esc(title)}</span>${icon('chevron', 'chev')}</summary>
    <div class="acc-body selectable">${body}</div>
  </details>`;
}

const bullets = (items) => `<ul class="bullets">${items.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`;

function renderInfo() {
  const parts = [];
  parts.push(`<div class="info-hero"><p class="info-hero-title">ILLUSIONS 2026</p><p>Horsens · torsdag 15. til søndag 18. oktober 2026</p></div>`);

  const [checkin, ...rest] = DATA.info;
  parts.push(accordion(checkin.id, checkin.titel, 'wristband', bullets(checkin.punkter), true));

  const legend = `<ul class="legend">${ACCESS_KEYS.map((k) => `<li>${accessTag(k, { plainName: true })}<span>${esc(ACCESS[k].kort)}</span></li>`).join('')}</ul>`;
  parts.push(accordion('adgang', 'Adgangstyper', 'ticket', legend));

  const menus = DATA.menuer.map((m) => {
    const a = ACT_BY_ID.get(m.aktivitet);
    const meta = a ? `<button type="button" class="menu-meta" data-open="${a.id}">${icon('clock')}<span>${esc(DAY_BY_ID[a.dag].navn)} kl. ${esc(timeText(a))} · ${esc(placeName(a))}</span></button>` : '';
    return `<article class="menu"><h2>${esc(m.titel)}</h2>${meta}${m.intro ? `<p class="menu-intro">${esc(m.intro)}</p>` : ''}${bullets(m.retter)}</article>`;
  }).join('');
  parts.push(accordion('mad', 'Mad og drikke', 'sparkle', `${menus}<div class="d-note">${icon('info')}<div>${DATA.madNoter.map((t) => `<p>${esc(t)}</p>`).join('')}<p><a href="mailto:tryl@pegani.dk?subject=${encodeURIComponent('Allergier – ILLUSIONS 2026')}">Skriv om allergier</a></p></div></div>`));

  const icons = { butik: 'door', kaffe: 'sparkle', del: 'share' };
  for (const sec of rest) parts.push(accordion(sec.id, sec.titel, icons[sec.id] || 'info', bullets(sec.punkter)));

  const usedPlaces = [...new Set(ACTS.map((a) => a.sted))];
  const places = usedPlaces.map((id) => {
    const st = STEDER[id];
    const q = mapsQuery(id);
    return `<li class="place"><div><strong>${esc(st.navn)}</strong><span>${esc(st.adresse || st.note || 'Horsens')}</span></div>
      <a class="icon-btn" href="${esc(mapsUrl(q))}" target="_blank" rel="noopener" data-maps="${esc(q)}" aria-label="Vis ${esc(st.navn)} i Google Maps">${icon('pin')}</a></li>`;
  }).join('');
  parts.push(accordion('steder', 'Steder og adresser', 'pin', `<ul class="places">${places}</ul>`));

  const contacts = DATA.kontakt.map((c) => `<li class="contact"><strong>${esc(c.navn)}</strong><div class="contact-actions">
    ${c.tlf ? `<a class="btn" href="tel:+45${c.tlf.replace(/\s/g, '')}">${icon('phone')}<span>${esc(c.tlf)}</span></a>` : ''}
    ${c.email ? `<a class="btn" href="mailto:${esc(c.email)}">${icon('mail')}<span>${esc(c.email)}</span></a>` : ''}</div></li>`).join('');
  parts.push(accordion('kontakt', 'Kontakt', 'phone', `<ul class="contacts">${contacts}</ul>`));

  let install;
  if (isStandalone()) install = '<p>Appen er installeret på din hjemmeskærm.</p>';
  else if (deferredInstall) install = `<p>Læg appen på hjemmeskærmen, så åbner den i fuld skærm og virker offline.</p><button type="button" class="btn btn--primary" data-act="install">${icon('download')}<span>Installér appen</span></button>`;
  else if (isIOS()) install = '<p>Åbn siden i Safari, tryk på Del-ikonet og vælg <strong>Føj til hjemmeskærm</strong>.</p>';
  else install = '<p>Åbn browserens menu og vælg <strong>Installér app</strong> eller <strong>Føj til startskærm</strong>.</p>';
  const offlineReady = navigator.serviceWorker?.controller ? 'Programmet er gemt på telefonen og virker uden net.' : 'Programmet gemmes til offline brug, når siden er indlæst.';
  parts.push(accordion('app', 'Om appen', 'info', `${install}
    <p>${esc(offlineReady)}</p>
    <p>${esc(DATA.meta.forbehold)}</p>
    <p class="muted">Version ${APP_VERSION} · program ${esc(DATA.meta.programVersion)}</p>
    <button type="button" class="btn btn--ghost" data-act="reset-all">Nulstil mine valg</button>`));

  return `<div class="info">${parts.join('')}</div>`;
}

/* ------------------------------------------------------------ Rendering */

function renderContent({ scroll = 'keep', anim = '' } = {}) {
  const c = els.content;
  const prevTop = c.scrollTop;
  let html;
  if (state.tab === 'program') html = renderProgram();
  else if (state.tab === 'mit') html = renderMine();
  else if (state.tab === 'nu') html = renderNow();
  else html = renderInfo();
  c.innerHTML = `<div class="pane${anim ? ` pane--${anim}` : ''}" id="pane">${html}</div>`;
  c.setAttribute('aria-labelledby', state.tab === 'program' || state.tab === 'mit' ? `daytab-${state.day}` : 'tab-title');

  if (scroll === 'keep') c.scrollTop = prevTop;
  else if (scroll === 'top') c.scrollTop = 0;
  else if (scroll === 'auto') autoScroll();
}

function autoScroll() {
  const c = els.content;
  c.scrollTop = 0;
  const now = clockNow();
  if (now.dayId !== state.day || (state.tab !== 'program' && state.tab !== 'mit')) return;
  const yIn = (el) => el.getBoundingClientRect().top - c.getBoundingClientRect().top + c.scrollTop;
  const line = $('#nowline');
  if (line && !line.hidden) {
    c.scrollTop = Math.max(0, yIn(line) - c.clientHeight * 0.3);
    return;
  }
  const groups = [...c.querySelectorAll('.group[data-hour]')];
  const target = groups.find((g) => Number(g.dataset.hour) * 60 + 59 >= now.minutes);
  if (target) c.scrollTop = Math.max(0, yIn(target) - 8);
}

function render(opts) {
  renderTopbar();
  renderNav();
  renderContent(opts);
}

function setTab(tab, { push = false } = {}) {
  if (!TABS.includes(tab)) return;
  const changed = state.tab !== tab;
  state.tab = tab;
  try { history.replaceState(history.state, '', `#${tab}`); } catch { /* fil-url */ }
  render({ scroll: changed || push ? 'auto' : 'keep' });
  if (changed) els.content.focus({ preventScroll: true });
}

function setDay(dayId, { anim = '' } = {}) {
  if (!DAY_BY_ID[dayId] || dayId === state.day) return;
  state.day = dayId;
  save();
  renderTopbar();
  renderContent({ scroll: 'auto', anim: matchMedia('(prefers-reduced-motion: reduce)').matches ? '' : anim });
}

function shiftDay(dir) {
  const i = DAY_BY_ID[state.day].index + dir;
  if (i < 0 || i >= DAYS.length) return false;
  setDay(DAYS[i].id, { anim: dir > 0 ? 'from-right' : 'from-left' });
  return true;
}

/* -------------------------------------------------------------- Detaljer */

function shareUrl(a) {
  return `${location.origin}${location.pathname}#a=${encodeURIComponent(a.id)}`;
}

function detailHtml(a) {
  const day = DAY_BY_ID[a.dag];
  const st = STEDER[a.sted] || {};
  const starred = state.stars.has(a.id);
  const others = ACTS.filter((o) => state.stars.has(o.id));
  const clash = conflictsWith(a, others);
  const q = mapsQuery(a.sted);

  const tags = [accessTag(a.adgang)];
  tags.push(`<span class="tag tag--plain">${icon('people')}<span>${AUDIENCE[a.maalgruppe] || 'For alle'}</span></span>`);
  if (a.aabent) tags.push(`<span class="tag tag--plain">${icon('door')}<span>Kom og gå</span></span>`);
  if (a.heleDagen) tags.push(`<span class="tag tag--plain">${icon('clock')}<span>Hele dagen</span></span>`);

  const warn = clash.length
    ? `<div class="alert alert--danger" role="note">${icon('warn')}<div><strong>Overlapper ${starred ? 'andet i' : ''} dit program</strong>
        <ul>${clash.map((o) => `<li><button type="button" class="link" data-open="${o.id}">${esc(o.titel)}</button> kl. ${esc(timeText(o))}, ${esc(placeShort(o))}</li>`).join('')}</ul></div></div>`
    : '';

  return `<article class="detail acc-${ACC_CLASS[a.adgang]}">
    <div class="d-tags">${tags.join('')}</div>
    <h2 class="d-title" data-sheet-title tabindex="-1">${esc(a.titel)}</h2>
    ${a.artist ? `<p class="d-artist selectable">${esc(a.artist)}</p>` : ''}
    ${warn}
    <dl class="d-facts">
      <div><dt>${icon('clock')}<span>Tid</span></dt><dd class="selectable">${esc(day.navn)} ${esc(fmtDate(day.dato))}, kl. ${esc(timeText(a))}<span class="muted">Varighed ${esc(fmtDuration(a.e - a.s))}</span></dd></div>
      <div><dt>${icon('pin')}<span>Sted</span></dt><dd class="selectable">${esc(placeName(a))}${st.adresse || st.note ? `<span class="muted">${esc([st.adresse, st.note].filter(Boolean).join(' · '))}</span>` : ''}</dd></div>
      <div><dt>${icon(ACCESS_ICON[a.adgang])}<span>Adgang</span></dt><dd>${esc(ACCESS[a.adgang]?.navn || a.adgang)}<span class="muted">${esc(ACCESS[a.adgang]?.kort || '')}</span></dd></div>
      <div><dt>${icon('people')}<span>Målgruppe</span></dt><dd>${esc(AUDIENCE[a.maalgruppe] || 'For alle')}</dd></div>
    </dl>
    ${a.beskrivelse ? `<p class="d-desc selectable">${esc(a.beskrivelse)}</p>` : ''}
    ${a.noter ? `<div class="d-note selectable">${icon('info')}<p>${esc(a.noter)}</p></div>` : ''}
    <div class="d-actions">
      <button type="button" class="btn btn--primary btn--wide star-toggle${starred ? ' is-on' : ''}" data-star="${a.id}" aria-pressed="${starred}">${icon(starred ? 'starFill' : 'star')}<span>${starred ? 'I mit program' : 'Tilføj til mit program'}</span></button>
      <a class="btn" href="${esc(mapsUrl(q))}" target="_blank" rel="noopener" data-maps="${esc(q)}">${icon('pin')}<span>Vis i Google Maps</span></a>
      <a class="btn" href="${esc(routeUrl(q))}" target="_blank" rel="noopener" data-maps="${esc(q)}">${icon('route')}<span>Rute dertil</span></a>
      <button type="button" class="btn" data-ics="${a.id}">${icon('calPlus')}<span>Tilføj til kalender</span></button>
      <button type="button" class="btn" data-share="${a.id}">${icon('share')}<span>Del</span></button>
    </div>
  </article>`;
}

let sheetKind = null;
let sheetActId = null;

function openActivity(id, { focus } = {}) {
  const a = ACT_BY_ID.get(id);
  if (!a) return;
  const keep = sheet.isOpen && sheetKind === 'act' && sheetActId === id ? sheet.body.scrollTop : 0;
  sheetKind = 'act';
  sheetActId = id;
  sheet.open(detailHtml(a), { focus, onClose: () => { sheetKind = null; sheetActId = null; } });
  if (keep) sheet.body.scrollTop = keep;
}

/* ---------------------------------------------------------------- Filtre */

function filterPlaces() {
  return [...new Set(ACTS.map((a) => a.sted))].sort((x, y) => (STEDER[x].kort || STEDER[x].navn).localeCompare(STEDER[y].kort || STEDER[y].navn, 'da'));
}

function filterCountText() {
  const n = ACTS.filter((a) => a.dag === state.day && matches(a)).length;
  return `Vis ${n} ${n === 1 ? 'aktivitet' : 'aktiviteter'}`;
}

function filtersHtml() {
  const f = state.filters;
  return `<div class="filters">
    <h2 class="sheet-h" data-sheet-title tabindex="-1">Filtre</h2>
    <label class="search">${icon('search')}<span class="sr-only">Søg i titel og artist</span>
      <input id="f-q" type="search" enterkeyhint="search" placeholder="Søg i titel og artist" value="${esc(f.q)}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
    </label>
    <fieldset class="field"><legend>Adgang</legend><div class="choices">
      ${ACCESS_KEYS.map((k) => `<button type="button" class="choice acc-${ACC_CLASS[k]}" data-f-adgang="${esc(k)}" aria-pressed="${f.adgang.has(k)}">${icon(ACCESS_ICON[k])}<span>${esc(ACCESS[k].navn)}</span></button>`).join('')}
    </div></fieldset>
    <fieldset class="field"><legend>Målgruppe</legend>
      <div class="segmented" role="radiogroup" aria-label="Målgruppe">
        ${Object.entries({ alle: 'Alle', børn: 'Børn', voksne: 'Voksne' }).map(([v, l]) => `<button type="button" role="radio" data-f-maal="${v}" aria-checked="${f.maalgruppe === v}">${l}</button>`).join('')}
      </div>
      <p class="hint">Børn og Voksne viser også aktiviteter for alle.</p>
    </fieldset>
    <fieldset class="field"><legend>Sted</legend><div class="choices">
      ${filterPlaces().map((id) => `<button type="button" class="choice" data-f-sted="${esc(id)}" aria-pressed="${f.steder.has(id)}"><span>${esc(STEDER[id].kort || STEDER[id].navn)}</span></button>`).join('')}
    </div></fieldset>
    <div class="switch-row"><label for="f-mine">Kun mit program</label><input type="checkbox" class="switch" id="f-mine" role="switch"${f.kunMine ? ' checked' : ''}></div>
    <div class="sheet-actions">
      <button type="button" class="btn" data-act="reset-filters">Nulstil</button>
      <button type="button" class="btn btn--primary" data-act="close-sheet" id="f-apply">${filterCountText()}</button>
    </div>
  </div>`;
}

function openFilters() {
  sheetKind = 'filters';
  sheet.open(filtersHtml(), { onClose: () => { sheetKind = null; } });
  const input = $('#f-q', sheet.body);
  let t;
  input.addEventListener('input', () => {
    clearTimeout(t);
    t = setTimeout(() => { state.filters.q = input.value; filtersChanged(); }, 120);
  });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); input.blur(); } });
  $('#f-mine', sheet.body).addEventListener('change', (e) => { state.filters.kunMine = e.target.checked; filtersChanged(); });
}

function syncFilterSheet() {
  if (sheetKind !== 'filters') return;
  const f = state.filters;
  const b = sheet.body;
  b.querySelectorAll('[data-f-adgang]').forEach((el) => el.setAttribute('aria-pressed', f.adgang.has(el.dataset.fAdgang)));
  b.querySelectorAll('[data-f-sted]').forEach((el) => el.setAttribute('aria-pressed', f.steder.has(el.dataset.fSted)));
  b.querySelectorAll('[data-f-maal]').forEach((el) => el.setAttribute('aria-checked', f.maalgruppe === el.dataset.fMaal));
  const q = $('#f-q', b);
  if (q && q.value !== f.q) q.value = f.q;
  const mine = $('#f-mine', b);
  if (mine) mine.checked = f.kunMine;
  const apply = $('#f-apply', b);
  if (apply) apply.textContent = filterCountText();
}

function filtersChanged() {
  save();
  renderTopbar();
  if (state.tab === 'program') renderContent({ scroll: 'top' });
  syncFilterSheet();
}

function resetFilters() {
  state.filters = { adgang: new Set(), maalgruppe: 'alle', steder: new Set(), kunMine: false, q: '' };
  filtersChanged();
}

/* --------------------------------------------------------------- Toast */

let toastTimer;
function toast(msg, { action, onAction, duration = 3200 } = {}) {
  clearTimeout(toastTimer);
  els.toast.innerHTML = `<div class="toast-inner"><span>${esc(msg)}</span>${action ? `<button type="button" class="toast-btn">${esc(action)}</button>` : ''}</div>`;
  els.toast.classList.add('is-show');
  if (action) {
    els.toast.querySelector('.toast-btn').addEventListener('click', () => { hideToast(); onAction?.(); }, { once: true });
  }
  toastTimer = setTimeout(hideToast, action ? 9000 : duration);
}
function hideToast() {
  els.toast.classList.remove('is-show');
}

/* -------------------------------------------------------------- Handlinger */

function toggleStar(id) {
  const a = ACT_BY_ID.get(id);
  if (!a) return;
  const on = !state.stars.has(id);
  if (on) state.stars.add(id); else state.stars.delete(id);
  save();
  renderTopbar();
  renderNav();
  renderContent({ scroll: 'keep' });
  if (sheetKind === 'act') openActivity(sheetActId, { focus: '.star-toggle' });
  if (on) {
    const clash = conflictsWith(a, ACTS.filter((o) => state.stars.has(o.id)));
    toast(clash.length ? `Tilføjet – overlapper ${clash.map((o) => o.titel).join(' og ')}` : 'Tilføjet til mit program', { duration: clash.length ? 5000 : 2400 });
  } else {
    toast('Fjernet fra mit program', { action: 'Fortryd', onAction: () => toggleStar(id) });
  }
}

function downloadIcs(a) {
  const st = STEDER[a.sted] || {};
  const location = [placeName(a), st.adresse || 'Horsens'].join(', ');
  const description = [
    a.artist, a.beskrivelse, a.noter,
    `Adgang: ${ACCESS[a.adgang]?.navn || a.adgang}${a.adgang === '?' ? ' (tjek ved indtjekning)' : ''}`,
    a.visTid ? `Tid: ${a.visTid}` : '',
    DATA.meta.navn,
  ].filter(Boolean).join('\n');
  const ics = buildIcs(a, { location, description, url: shareUrl(a) });
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `illusions-${a.id}.ics`;
  link.rel = 'noopener';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  toast('Kalenderfil hentet – åbn den for at tilføje', { duration: 4000 });
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:-100px;opacity:0';
    document.body.append(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    ta.remove();
    return ok;
  }
}

async function shareAct(a) {
  const text = `${a.titel} – ${DAY_BY_ID[a.dag].navn} ${fmtDate(a.dato)} kl. ${timeText(a)}, ${placeName(a)}. ${DATA.meta.navn}`;
  const url = shareUrl(a);
  if (navigator.share) {
    try { await navigator.share({ title: a.titel, text, url }); return; } catch (err) { if (err && err.name === 'AbortError') return; }
  }
  const ok = await copyText(`${text}\n${url}`);
  toast(ok ? 'Kopieret – sæt ind hvor du vil dele' : 'Kunne ikke kopiere');
}

/* --------------------------------------------------------------- Events */

document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-maps],[data-open],[data-star],[data-tab],[data-day],[data-act],[data-ics],[data-share],[data-chip],[data-f-adgang],[data-f-maal],[data-f-sted]');
  if (!t) return;
  const d = t.dataset;

  if (d.maps !== undefined) {
    if (!navigator.onLine) {
      e.preventDefault();
      const addr = d.maps;
      toast(`Du er offline – kortet kræver net. ${addr}`, { action: 'Kopiér', onAction: () => copyText(addr) });
    }
    return;
  }
  if (d.open) { openActivity(d.open); return; }
  if (d.star) { toggleStar(d.star); return; }
  if (d.tab) { if (sheet.isOpen) sheet.close(); setTab(d.tab); return; }
  if (d.day) { setDay(d.day); return; }
  if (d.ics) { const a = ACT_BY_ID.get(d.ics); if (a) downloadIcs(a); return; }
  if (d.share) { const a = ACT_BY_ID.get(d.share); if (a) shareAct(a); return; }
  if (d.chip) {
    const [type, val] = d.chip.split(':');
    const f = state.filters;
    if (type === 'adgang') f.adgang.delete(val);
    if (type === 'sted') f.steder.delete(val);
    if (type === 'maal') f.maalgruppe = 'alle';
    if (type === 'mine') f.kunMine = false;
    if (type === 'q') f.q = '';
    filtersChanged();
    return;
  }
  if (d.fAdgang) { const s = state.filters.adgang; s.has(d.fAdgang) ? s.delete(d.fAdgang) : s.add(d.fAdgang); filtersChanged(); return; }
  if (d.fSted) { const s = state.filters.steder; s.has(d.fSted) ? s.delete(d.fSted) : s.add(d.fSted); filtersChanged(); return; }
  if (d.fMaal) { state.filters.maalgruppe = d.fMaal; filtersChanged(); return; }

  switch (d.act) {
    case 'close-sheet': sheet.close(); break;
    case 'reset-filters': resetFilters(); break;
    case 'toggle-allday':
      state.alldayOpen = !state.alldayOpen;
      save();
      renderContent({ scroll: 'keep' });
      break;
    case 'install':
      if (deferredInstall) {
        deferredInstall.prompt();
        deferredInstall.userChoice.finally(() => { deferredInstall = null; if (state.tab === 'info') renderContent(); });
      }
      break;
    case 'reset-all':
      if (confirm('Fjern alle stjernemarkeringer og filtre?')) {
        state.stars.clear();
        resetFilters();
        render({ scroll: 'keep' });
        toast('Dine valg er nulstillet');
      }
      break;
    default: break;
  }
});

els.btnView.addEventListener('click', () => {
  state.view = state.view === 'kalender' ? 'liste' : 'kalender';
  save();
  renderTopbar();
  renderContent({ scroll: 'auto' });
});
els.btnFilter.addEventListener('click', openFilters);

els.daytabs.addEventListener('keydown', (e) => {
  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== 'Home' && e.key !== 'End') return;
  e.preventDefault();
  const i = DAY_BY_ID[state.day].index;
  const next = e.key === 'Home' ? 0 : e.key === 'End' ? DAYS.length - 1 : i + (e.key === 'ArrowRight' ? 1 : -1);
  if (next < 0 || next >= DAYS.length) return;
  setDay(DAYS[next].id, { anim: next > i ? 'from-right' : 'from-left' });
  $(`#daytab-${DAYS[next].id}`)?.focus();
});

// Vandret swipe mellem dage
(function swipeDays() {
  const c = els.content;
  let sx = 0; let sy = 0; let dx = 0; let t0 = 0; let mode = null;
  const pane = () => $('#pane');
  const enabled = () => (state.tab === 'program' || state.tab === 'mit') && !sheet.isOpen;

  c.addEventListener('touchstart', (e) => {
    if (!enabled() || e.touches.length !== 1) { mode = 'off'; return; }
    sx = e.touches[0].clientX; sy = e.touches[0].clientY; dx = 0; t0 = performance.now(); mode = null;
  }, { passive: true });

  c.addEventListener('touchmove', (e) => {
    if (mode === 'off' || mode === 'v') return;
    const x = e.touches[0].clientX - sx;
    const y = e.touches[0].clientY - sy;
    if (!mode) {
      if (Math.abs(x) > 12 && Math.abs(x) > Math.abs(y) * 1.4) mode = 'h';
      else if (Math.abs(y) > 10) { mode = 'v'; return; } else return;
    }
    dx = x;
    const i = DAY_BY_ID[state.day].index;
    const edge = (dx > 0 && i === 0) || (dx < 0 && i === DAYS.length - 1);
    const p = pane();
    if (p) { p.style.transition = 'none'; p.style.transform = `translateX(${edge ? dx * 0.2 : dx * 0.55}px)`; p.style.opacity = String(1 - Math.min(0.5, Math.abs(dx) / 700)); }
  }, { passive: true });

  const end = () => {
    if (mode !== 'h') { mode = null; return; }
    mode = null;
    const p = pane();
    const v = Math.abs(dx) / Math.max(1, performance.now() - t0);
    const go = Math.abs(dx) > 70 || (Math.abs(dx) > 30 && v > 0.45);
    if (go && shiftDay(dx < 0 ? 1 : -1)) return;
    if (p) { p.style.transition = ''; p.style.transform = ''; p.style.opacity = ''; }
  };
  c.addEventListener('touchend', end);
  c.addEventListener('touchcancel', end);
})();

// Offline-indikator
function updateOnline() {
  els.offline.hidden = navigator.onLine;
}
window.addEventListener('online', updateOnline);
window.addEventListener('offline', updateOnline);

// iOS ignorerer user-scalable=no – stop knibe-zoom
document.addEventListener('gesturestart', (e) => e.preventDefault());

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstall = e;
  if (state.tab === 'info') renderContent();
});

// Minut-ur: opdatér "nu"-linje og Nu og næste
let lastDayId = clockNow().dayId;
function tick() {
  const now = clockNow();
  if (now.dayId !== lastDayId) {
    lastDayId = now.dayId;
    renderTopbar();
    renderContent({ scroll: 'keep' });
    return;
  }
  if (state.tab === 'nu') { renderContent({ scroll: 'keep' }); return; }
  const line = $('#nowline');
  if (line) {
    const show = now.dayId === state.day && now.minutes >= CAL_START && now.minutes <= CAL_END;
    line.hidden = !show;
    line.style.top = `${yOf(now.minutes)}px`;
    line.firstElementChild.textContent = fmtTime(now.minutes);
  }
}
function scheduleTick() {
  setTimeout(() => { tick(); scheduleTick(); }, 60000 - (Date.now() % 60000) + 50);
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });

/* ------------------------------------------------------ Service worker */

function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  let reloading = false;
  let requested = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!requested || reloading) return;
    reloading = true;
    location.reload();
  });
  navigator.serviceWorker.addEventListener('message', (e) => {
    if (e.data?.type === 'DATA_UPDATED') toast('Programmet er opdateret', { action: 'Genindlæs', onAction: () => location.reload() });
  });
  const offerUpdate = (worker) => {
    toast('Ny version af appen er klar', {
      action: 'Opdatér',
      onAction: () => { requested = true; worker.postMessage({ type: 'SKIP_WAITING' }); },
    });
  };
  navigator.serviceWorker.register('sw.js').then((reg) => {
    if (reg.waiting && navigator.serviceWorker.controller) offerUpdate(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const w = reg.installing;
      if (!w) return;
      w.addEventListener('statechange', () => {
        if (w.state === 'installed' && navigator.serviceWorker.controller) offerUpdate(w);
      });
    });
    setInterval(() => reg.update().catch(() => {}), 30 * 60 * 1000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) reg.update().catch(() => {}); });
  }).catch(() => { /* fx file:// – appen virker stadig online */ });
}

/* ------------------------------------------------------------------ Start */

function init() {
  const hash = decodeURIComponent(location.hash.slice(1));
  let openId = null;
  if (hash.startsWith('a=') && ACT_BY_ID.has(hash.slice(2))) {
    openId = hash.slice(2);
    state.tab = 'program';
    state.day = ACT_BY_ID.get(openId).dag;
  } else if (TABS.includes(hash)) {
    state.tab = hash;
  }
  try { history.replaceState(null, '', `#${state.tab}`); } catch { /* ignore */ }
  updateOnline();
  render({ scroll: 'auto' });
  if (openId) openActivity(openId);
  scheduleTick();
  registerSW();
  try { navigator.storage?.persist?.(); } catch { /* valgfrit */ }
}

init();
