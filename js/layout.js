// Ren logik uden DOM: overlap, kalenderlayout, konflikter og skift mellem steder.

/** To tidsrum overlapper, når hver starter før den anden slutter. Rørende tider overlapper ikke. */
export function overlaps(a, b) {
  return a.s < b.e && b.s < a.e;
}

/** Fast aktivitet = deltager hele tiden. Hele dagen og "kom og gå" giver ikke konflikter. */
export const isFixed = (a) => !a.heleDagen && !a.aabent;

/**
 * Kolonnelayout som i Google Kalender.
 * events: [{ id, s, e }] i minutter. minDur: blokkens synlige minimumslængde,
 * så korte blokke, der er strakt ud visuelt, ikke dækker hinanden.
 * Returnerer Map id -> { col, cols, span }.
 */
export function layoutColumns(events, minDur = 0) {
  const items = events
    .map((ev) => ({ id: ev.id, s: ev.s, ve: Math.max(ev.e, ev.s + minDur) }))
    .sort((a, b) => a.s - b.s || (b.ve - b.s) - (a.ve - a.s) || String(a.id).localeCompare(String(b.id)));

  const result = new Map();
  let cluster = [];
  let clusterEnd = -Infinity;

  const flush = () => {
    const colEnds = [];
    const colOf = new Map();
    for (const it of cluster) {
      let c = colEnds.findIndex((end) => end <= it.s);
      if (c === -1) { c = colEnds.length; colEnds.push(it.ve); } else colEnds[c] = it.ve;
      colOf.set(it, c);
    }
    const cols = colEnds.length;
    for (const it of cluster) {
      const col = colOf.get(it);
      let span = 1;
      for (let k = col + 1; k < cols; k++) {
        const blocked = cluster.some((o) => o !== it && colOf.get(o) === k && o.s < it.ve && it.s < o.ve);
        if (blocked) break;
        span++;
      }
      result.set(it.id, { col, cols, span });
    }
  };

  for (const it of items) {
    if (cluster.length && it.s >= clusterEnd) { flush(); cluster = []; clusterEnd = -Infinity; }
    cluster.push(it);
    clusterEnd = Math.max(clusterEnd, it.ve);
  }
  if (cluster.length) flush();
  return result;
}

/** Grupper af aktiviteter, der (visuelt) hænger sammen i tid. */
export function clusterize(events, minDur = 0) {
  const items = [...events].sort((a, b) => a.s - b.s || b.e - a.e);
  const out = [];
  let cur = [];
  let end = -Infinity;
  for (const ev of items) {
    if (cur.length && ev.s >= end) { out.push(cur); cur = []; end = -Infinity; }
    cur.push(ev);
    end = Math.max(end, ev.e, ev.s + minDur);
  }
  if (cur.length) out.push(cur);
  return out;
}

/**
 * Dagslayout: hvor "kom og gå"-tidsrum (isWindow) deler tid med faste aktiviteter,
 * lægges tidsrummene som smalle skinner til venstre (rail), og de faste aktiviteter
 * deler resten af bredden. Returnerer Map id -> { col, cols, span, rails, rail }.
 */
export function layoutDay(events, { minDur = 0, isWindow = () => false } = {}) {
  const out = new Map();
  for (const cluster of clusterize(events, minDur)) {
    const win = cluster.filter(isWindow);
    const fix = cluster.filter((ev) => !isWindow(ev));
    if (!win.length || !fix.length) {
      for (const [id, l] of layoutColumns(cluster, minDur)) out.set(id, { ...l, rails: 0, rail: false });
      continue;
    }
    const lw = layoutColumns(win, minDur);
    const rails = Math.max(...[...lw.values()].map((l) => l.col + 1));
    for (const [id, l] of lw) out.set(id, { col: l.col, cols: rails, span: 1, rails, rail: true });
    for (const [id, l] of layoutColumns(fix, minDur)) out.set(id, { ...l, rails, rail: false });
  }
  return out;
}

/**
 * Alle par af faste aktiviteter samme dag, der overlapper.
 * Returnerer [{ a, b, s, e }] hvor s/e er selve overlappet.
 */
export function findConflicts(list) {
  const fixed = list.filter(isFixed).sort((x, y) => x.abs - y.abs || x.e - y.e);
  const out = [];
  for (let i = 0; i < fixed.length; i++) {
    for (let j = i + 1; j < fixed.length; j++) {
      const a = fixed[i];
      const b = fixed[j];
      if (a.dag !== b.dag) continue;
      if (b.s >= a.e) continue;
      if (overlaps(a, b)) out.push({ a, b, s: Math.max(a.s, b.s), e: Math.min(a.e, b.e) });
    }
  }
  return out;
}

/** Id'er på aktiviteter i listen, der er i konflikt med mindst én anden. */
export function conflictIds(list) {
  const ids = new Set();
  for (const c of findConflicts(list)) { ids.add(c.a.id); ids.add(c.b.id); }
  return ids;
}

/** Andre aktiviteter i `list`, der overlapper `act` (kun faste). */
export function conflictsWith(act, list) {
  if (!isFixed(act)) return [];
  return list.filter((o) => o.id !== act.id && isFixed(o) && o.dag === act.dag && overlaps(act, o));
}

/**
 * Stramme skift: to faste aktiviteter i træk på forskellige steder med under
 * `limit` minutters mellemrum. Returnerer [{ from, to, gap }].
 */
export function tightTransfers(list, limit = 15) {
  const fixed = list.filter(isFixed).sort((x, y) => x.abs - y.abs || x.e - y.e);
  const out = [];
  for (let i = 1; i < fixed.length; i++) {
    const to = fixed[i];
    const prev = fixed.slice(0, i).filter((p) => p.dag === to.dag && p.e <= to.s);
    if (!prev.length) continue;
    const from = prev.reduce((best, p) => (p.e > best.e ? p : best));
    const gap = to.s - from.e;
    if (gap < limit && from.sted !== to.sted) out.push({ from, to, gap });
  }
  return out;
}
