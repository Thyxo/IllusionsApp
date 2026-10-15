// Kør: node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import DATA from '../data.js';
import { spanOf, fmtTime, fmtDuration, festivalClock, cphParts, dayDiff } from '../js/time.js';
import { overlaps, layoutColumns, layoutDay, findConflicts, conflictsWith, tightTransfers } from '../js/layout.js';
import { buildIcs, foldLine } from '../js/ics.js';

const dayIndex = Object.fromEntries(DATA.dage.map((d, i) => [d.id, i]));
const dato = Object.fromEntries(DATA.dage.map((d) => [d.id, d.dato]));
const acts = DATA.aktiviteter.map((a) => {
  const { s, e } = spanOf(a.start, a.slut);
  return { ...a, s, e, dato: dato[a.dag], abs: dayIndex[a.dag] * 1440 + s };
});
const byId = (id) => acts.find((a) => a.id === id);

test('data.js er ren JSON mellem markørerne', () => {
  const src = readFileSync(fileURLToPath(new URL('../data.js', import.meta.url)), 'utf8');
  const json = src.split('/* DATA_START */')[1].split('/* DATA_SLUT */')[0];
  const parsed = JSON.parse(json);
  assert.deepEqual(parsed, DATA);
});

test('alle aktiviteter har de krævede felter og gyldige referencer', () => {
  const required = ['id', 'dag', 'start', 'slut', 'titel', 'sted', 'adgang', 'maalgruppe', 'beskrivelse', 'noter'];
  const ids = new Set();
  for (const a of DATA.aktiviteter) {
    for (const k of required) assert.ok(k in a, `${a.id} mangler ${k}`);
    assert.ok(!ids.has(a.id), `dobbelt id ${a.id}`);
    ids.add(a.id);
    assert.ok(a.dag in dayIndex, `${a.id}: dag`);
    assert.ok(a.sted in DATA.steder, `${a.id}: sted ${a.sted}`);
    assert.ok(a.adgang in DATA.adgang, `${a.id}: adgang`);
    assert.ok(['alle', 'børn', 'voksne'].includes(a.maalgruppe), `${a.id}: maalgruppe`);
    assert.match(a.start, /^\d{2}:\d{2}$/);
    assert.match(a.slut, /^\d{2}:\d{2}$/);
  }
  for (const m of DATA.menuer) assert.ok(ids.has(m.aktivitet), `menu ${m.titel}`);
});

test('tider efter midnat ligger på samme festivaldag', () => {
  assert.deepEqual(spanOf('22:00', '01:00'), { s: 1320, e: 1500 });
  assert.deepEqual(spanOf('21:30', '01:00'), { s: 1290, e: 1500 });
  assert.deepEqual(spanOf('20:15', '20:35'), { s: 1215, e: 1235 });
  assert.equal(fmtTime(1500), '01.00');
  assert.equal(fmtDuration(75), '1 time 15 min');
  assert.equal(fmtDuration(20), '20 min');
  assert.equal(fmtDuration(180), '3 timer');
});

test('festivalur: kl. 00.30 hører til dagen før', () => {
  assert.deepEqual(festivalClock({ date: '2026-10-17', minutes: 30 }), { date: '2026-10-16', minutes: 1470 });
  assert.deepEqual(festivalClock({ date: '2026-10-16', minutes: 600 }), { date: '2026-10-16', minutes: 600 });
  assert.equal(dayDiff('2026-10-15', '2026-10-18'), 3);
});

test('København-tid uafhængigt af enhedens tidszone', () => {
  // 18:15 UTC den 16. oktober = 20:15 sommertid i København
  assert.deepEqual(cphParts(new Date('2026-10-16T18:15:00Z')), { date: '2026-10-16', minutes: 20 * 60 + 15 });
  assert.deepEqual(cphParts(new Date('2026-10-16T22:30:00Z')), { date: '2026-10-17', minutes: 30 });
});

test('overlap: start < andens slut og omvendt; rørende tider overlapper ikke', () => {
  assert.equal(overlaps({ s: 1170, e: 1230 }, { s: 1215, e: 1235 }), true);
  assert.equal(overlaps({ s: 840, e: 900 }, { s: 900, e: 930 }), false);
  assert.equal(overlaps({ s: 900, e: 930 }, { s: 840, e: 900 }), false);
  assert.equal(overlaps({ s: 600, e: 700 }, { s: 620, e: 640 }), true);
  assert.equal(overlaps({ s: 620, e: 640 }, { s: 600, e: 700 }), true);
});

test('Forræder og Black Magic overlapper kl. 20.15', () => {
  const list = [byId('fre-forraeder'), byId('fre-black-magic')];
  const c = findConflicts(list);
  assert.equal(c.length, 1);
  assert.equal(fmtTime(c[0].s), '20.15');
  assert.deepEqual(new Set([c[0].a.id, c[0].b.id]), new Set(['fre-forraeder', 'fre-black-magic']));
  assert.equal(conflictsWith(byId('fre-black-magic'), list).length, 1);
});

test('kom-og-gå og hele dagen giver ikke konflikter', () => {
  const list = [byId('fre-indregistrering'), byId('fre-hector-1300'), byId('fre-poxycat')];
  assert.equal(findConflicts(list).length, 0);
});

test('aktiviteter på forskellige dage er aldrig i konflikt', () => {
  assert.equal(findConflicts([byId('fre-black-magic'), byId('lor-black-magic-1030')]).length, 0);
});

test('kalenderlayout: ingen blokke i samme kolonne dækker hinanden', () => {
  const minDur = 35;
  for (const d of DATA.dage) {
    const timed = acts.filter((a) => a.dag === d.id && !a.heleDagen);
    const L = layoutColumns(timed, minDur);
    assert.equal(L.size, timed.length);
    for (const a of timed) {
      for (const b of timed) {
        if (a === b) continue;
        const la = L.get(a.id);
        const lb = L.get(b.id);
        const aEnd = Math.max(a.e, a.s + minDur);
        const bEnd = Math.max(b.e, b.s + minDur);
        const visualOverlap = a.s < bEnd && b.s < aEnd;
        if (!visualOverlap) continue;
        const aCols = new Set(Array.from({ length: la.span }, (_, k) => la.col + k));
        const shared = Array.from({ length: lb.span }, (_, k) => lb.col + k).some((c) => aCols.has(c));
        assert.ok(!shared, `${a.id} og ${b.id} deler kolonne`);
        assert.equal(la.cols, lb.cols, `${a.id}/${b.id} i samme klynge skal have samme kolonneantal`);
      }
      const l = L.get(a.id);
      assert.ok(l.col + l.span <= l.cols);
    }
  }
});

test('dagslayout med skinner: ingen blokke overlapper på skærmen (288 px bredde)', () => {
  const W = 288; const RAIL = 46; const minDur = 35;
  for (const d of DATA.dage) {
    const timed = acts.filter((a) => a.dag === d.id && !a.heleDagen);
    const L = layoutDay(timed, { minDur, isWindow: (a) => !!a.aabent });
    const x = (a) => {
      const l = L.get(a.id);
      if (l.rail) return [l.col * RAIL, l.col * RAIL + RAIL];
      const rest = W - l.rails * RAIL;
      return [l.rails * RAIL + (rest * l.col) / l.cols, l.rails * RAIL + (rest * (l.col + l.span)) / l.cols];
    };
    for (const a of timed) {
      const [ax0, ax1] = x(a);
      assert.ok(ax0 >= 0 && ax1 <= W + 0.01, `${a.id} uden for bredden`);
      for (const b of timed) {
        if (a === b) continue;
        const vis = a.s < Math.max(b.e, b.s + minDur) && b.s < Math.max(a.e, a.s + minDur);
        if (!vis) continue;
        const [bx0, bx1] = x(b);
        assert.ok(ax1 <= bx0 + 0.01 || bx1 <= ax0 + 0.01, `${a.id} og ${b.id} overlapper på skærmen`);
      }
    }
  }
  const fre = layoutDay(acts.filter((a) => a.dag === 'fre' && !a.heleDagen), { minDur, isWindow: (a) => !!a.aabent });
  assert.equal(fre.get('fre-indregistrering').rail, true);
  assert.equal(fre.get('fre-middag').rails, 0);
});

test('enkeltstående blok får fuld bredde', () => {
  const L = layoutColumns([{ id: 'x', s: 600, e: 660 }]);
  assert.deepEqual(L.get('x'), { col: 0, cols: 1, span: 1 });
});

test('stramt skift mellem steder (< 15 min) findes', () => {
  const list = [byId('fre-middag'), byId('fre-alexandra')]; // slut 20.00 Jørgensens -> 21.00 HNT: 60 min
  assert.equal(tightTransfers(list).length, 0);
  const tight = [byId('lor-flip-pladsen'), byId('lor-talentholdet')]; // 11.00 -> 11.00, Pladsen -> Kuben
  const t = tightTransfers(tight);
  assert.equal(t.length, 1);
  assert.equal(t[0].gap, 0);
  const same = [byId('son-seminar3'), byId('son-talk-flip')]; // samme sted
  assert.equal(tightTransfers(same).length, 0);
});

test('ics: Europe/Copenhagen, efter midnat og foldede linjer', () => {
  const lounge = byId('fre-lounge');
  const ics = buildIcs(lounge, { location: 'Horsens Ny Teater, Teatertorvet, 8700 Horsens', description: 'Æblegrød; komma, og en meget lang beskrivelse '.repeat(5), now: new Date('2026-10-01T10:00:00Z') });
  assert.match(ics, /DTSTART;TZID=Europe\/Copenhagen:20261016T220000/);
  assert.match(ics, /DTEND;TZID=Europe\/Copenhagen:20261017T010000/);
  assert.match(ics, /BEGIN:VTIMEZONE\r\nTZID:Europe\/Copenhagen/);
  assert.match(ics, /LOCATION:Horsens Ny Teater\\, Teatertorvet\\, 8700 Horsens/);
  const enc = new TextEncoder();
  for (const line of ics.split('\r\n')) assert.ok(enc.encode(line).length <= 75, `for lang linje: ${line}`);
  assert.ok(ics.endsWith('END:VCALENDAR\r\n'));
  assert.equal(foldLine('kort'), 'kort');
});
