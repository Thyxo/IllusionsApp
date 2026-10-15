// Browser-test i Chromium (Playwright). Kræver en lokal server:
//   npx http-server -p 8080 -c-1   (i et andet vindue)
//   node tests/e2e.mjs [http://localhost:8080] [mappe-til-skærmbilleder]
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';

let chromium;
try { ({ chromium } = await import('playwright')); } catch {
  ({ chromium } = createRequire(`${execSync('npm root -g').toString().trim()}/`)('playwright'));
}

const BASE = process.argv[2] || 'http://localhost:8080';
const SHOTS = process.argv[3] || '';
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const shot = async (page, name) => { if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}.png` }); };

const browser = await chromium.launch();
const results = [];
const check = async (name, fn) => {
  try { await fn(); results.push(['ok', name]); } catch (err) { results.push(['FEJL', name, err.message]); }
};

async function newPage({ width = 360, height = 740, scheme = 'dark', nu = '2026-10-16T20:20' } = {}) {
  const ctx = await browser.newContext({
    viewport: { width, height }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
    colorScheme: scheme, locale: 'da-DK', timezoneId: 'Europe/Copenhagen', serviceWorkers: 'allow',
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(`${BASE}/?nu=${nu}`);
  await page.waitForSelector('.navbtn');
  return { ctx, page, errors };
}

const noHorizontalScroll = async (page) => {
  const r = await page.evaluate(() => ({
    doc: document.documentElement.scrollWidth, win: innerWidth,
    content: document.querySelector('#content').scrollWidth, contentW: document.querySelector('#content').clientWidth,
    pageScroll: document.scrollingElement.scrollHeight - innerHeight,
    topbar: document.querySelector('.topbar').getBoundingClientRect().top,
    navBottom: document.querySelector('#bottomnav').getBoundingClientRect().bottom,
    navH: document.querySelector('#bottomnav').getBoundingClientRect().height,
    appH: document.querySelector('#app').getBoundingClientRect().height,
  }));
  assert.equal(r.topbar, 0, 'topbar er rykket');
  assert.ok(Math.abs(r.navBottom - r.appH) < 1 && r.navH >= 54, `bundmenu ${r.navH}px / ${r.navBottom}`);
  assert.ok(r.doc <= r.win, `dokument ${r.doc} > ${r.win}`);
  assert.ok(r.content <= r.contentW, `indhold ${r.content} > ${r.contentW}`);
  assert.ok(r.pageScroll <= 0, `siden kan scrolle ${r.pageScroll}px`);
};

// ---------------------------------------------------------------- Mørk, 360 px
{
  const { ctx, page, errors } = await newPage();

  await check('åbner på dags dato (fredag via ?nu)', async () => {
    assert.equal(await page.getAttribute('.daytab.is-active', 'data-day'), 'fre');
  });
  await check('nu-linje vises på dags dato', async () => {
    assert.equal(await page.isVisible('#nowline'), true);
    assert.equal((await page.textContent('#nowline span')).trim(), '20.20');
  });
  await check('kalender: ingen sidescroll, siden scroller ikke', () => noHorizontalScroll(page));
  await check('kalender: alle blokke min. 44 px høje og inden for kolonnen', async () => {
    const bad = await page.$$eval('.ev', (els) => els.filter((e) => {
      const r = e.getBoundingClientRect();
      const p = e.parentElement.getBoundingClientRect();
      return r.height < 43.5 || r.left < p.left - 1 || r.right > p.right + 1;
    }).map((e) => e.textContent.trim()));
    assert.deepEqual(bad, []);
  });
  await shot(page, '01-kalender-fredag');

  await check('touch-mål i topbar og bundnav er mindst 44 px', async () => {
    const small = await page.$$eval('.topbar button:not([hidden]), .navbtn', (els) => els.filter((e) => {
      const r = e.getBoundingClientRect();
      return r.width > 0 && (r.width < 44 || r.height < 44);
    }).map((e) => e.getAttribute('aria-label') || e.textContent.trim()));
    assert.deepEqual(small, []);
  });

  await check('detaljer: bundark med kort-links og knapper', async () => {
    await page.evaluate(() => { document.querySelector('#content').scrollTop = 0; });
    await page.click('.ev[data-open="fre-black-magic"]');
    await page.waitForSelector('.sheet-root.is-open');
    await page.waitForTimeout(400);
    const maps = await page.getAttribute('.d-actions a[href*="maps/search"]', 'href');
    assert.equal(maps, 'https://www.google.com/maps/search/?api=1&query=Horsens%20Ny%20Teater%2C%20Teatertorvet%2C%208700%20Horsens');
    const route = await page.getAttribute('.d-actions a[href*="maps/dir"]', 'href');
    assert.ok(route.includes('travelmode=walking') && route.includes('destination=Horsens%20Ny%20Teater'));
    assert.ok(await page.isVisible('[data-ics="fre-black-magic"]'));
    assert.ok(await page.isVisible('[data-share="fre-black-magic"]'));
  });
  await shot(page, '02-detaljer');

  await check('stjerne + overlap-advarsel i detaljer', async () => {
    await page.click('.d-actions [data-star]');
    await page.click('.sheet-close');
    await page.waitForTimeout(450);
    await page.click('.ev[data-open="fre-forraeder"]');
    await page.waitForSelector('.sheet-root.is-open');
    await page.click('.d-actions [data-star]');
    await page.waitForTimeout(100);
    const warn = await page.textContent('.detail .alert--danger');
    assert.ok(warn.includes('Black Magic'), warn);
  });
  await shot(page, '03-detaljer-overlap');

  await check('ics-download', async () => {
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('[data-ics="fre-forraeder"]')]);
    assert.equal(dl.suggestedFilename(), 'illusions-fre-forraeder.ics');
  });

  await check('swipe ned lukker bundarket', async () => {
    const box = await page.locator('.sheet-grab').boundingBox();
    const cdp = await page.context().newCDPSession(page);
    const x = box.x + 40; const y = box.y + 18;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    for (let i = 1; i <= 10; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y + i * 25 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(500);
    assert.equal(await page.isVisible('.sheet-root'), false);
  });

  await check('Mit program: banner om overlap kl. 20.15', async () => {
    await page.click('.navbtn[data-tab="mit"]');
    await noHorizontalScroll(page);
    const banner = await page.textContent('.alert--danger');
    assert.ok(/overlapper kl\. 20\.15/.test(banner), banner);
    assert.ok((await page.$$('.item.is-conflict')).length >= 1 || (await page.$$('.ev.is-conflict')).length >= 1);
  });
  await shot(page, '04-mit-program');

  await check('Mit program som liste', async () => {
    if (await page.getAttribute('#btn-view', 'aria-label') === 'Vis som liste') await page.click('#btn-view');
    assert.equal((await page.$$('.item.is-conflict')).length, 2);
    await noHorizontalScroll(page);
  });
  await shot(page, '05-mit-program-liste');

  await check('swipe vandret skifter dag', async () => {
    const box = await page.locator('#content').boundingBox();
    const cdp = await page.context().newCDPSession(page);
    const y = box.y + 200;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 300, y }] });
    for (let i = 1; i <= 8; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 300 - i * 25, y }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(350);
    assert.equal(await page.getAttribute('.daytab.is-active', 'data-day'), 'lor');
  });

  await check('Program som liste + filter-ark', async () => {
    await page.click('.navbtn[data-tab="program"]');
    await page.click('#daytab-fre');
    await noHorizontalScroll(page);
    await shot(page, '06-liste-fredag');
    await page.click('#btn-filter');
    await page.waitForSelector('.sheet-root.is-open');
    await page.click('[data-f-adgang="A"]');
    await page.click('[data-f-maal="voksne"]');
    await page.waitForTimeout(350);
    await shot(page, '07-filtre');
    await page.click('#f-apply');
    await page.waitForTimeout(400);
    const chips = await page.$$eval('.chip', (els) => els.map((e) => e.textContent.trim()));
    assert.ok(chips.includes('Armbånd') && chips.includes('Voksne') && chips.includes('Nulstil'), chips.join('|'));
    const titles = await page.$$eval('.item-title', (els) => els.map((e) => e.textContent.trim()));
    assert.ok(titles.includes('Black Magic') && !titles.includes('Jesper Grønkjær'), titles.join('|'));
    await shot(page, '08-filtre-chips');
  });

  await check('søgning på artist', async () => {
    await page.click('.chip--reset');
    await page.click('#btn-filter');
    await page.fill('#f-q', 'pritchard');
    await page.waitForTimeout(300);
    await page.click('#f-apply');
    await page.waitForTimeout(400);
    const titles = await page.$$eval('.item-title', (els) => els.map((e) => e.textContent.trim()));
    assert.deepEqual(titles, ['Workshop med Matt Pritchard']);
    await page.click('.chip--reset');
  });

  await check('Nu og næste', async () => {
    await page.click('.navbtn[data-tab="nu"]');
    const txt = await page.textContent('.now');
    assert.ok(txt.includes('Lige nu') && txt.includes('Næste 2 timer'));
    assert.ok(txt.includes('Black Magic') || txt.includes('En forræder på Hotellet'));
    await noHorizontalScroll(page);
  });
  await shot(page, '09-nu');

  await check('Info med menuer og sammenklappelige sektioner', async () => {
    await page.click('.navbtn[data-tab="info"]');
    await page.click('#info-mad summary');
    const txt = await page.textContent('#info-mad');
    assert.ok(txt.includes('langefilet') && txt.includes('allergier'));
    await noHorizontalScroll(page);
  });
  await shot(page, '10-info');

  await check('stjerner gemmes i localStorage', async () => {
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('illusions2026.v1')));
    assert.deepEqual(new Set(saved.stars), new Set(['fre-black-magic', 'fre-forraeder']));
  });

  await check('service worker styrer siden', async () => {
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await page.waitForSelector('.navbtn');
    assert.equal(await page.evaluate(() => !!navigator.serviceWorker.controller), true);
  });

  await check('offline: genindlæsning virker og viser banner', async () => {
    await ctx.setOffline(true);
    await page.reload();
    await page.waitForSelector('.navbtn');
    await page.click('.navbtn[data-tab="program"]');
    assert.ok((await page.$$('.ev, .item')).length > 5);
    assert.equal(await page.isVisible('#offline'), true);
    await shot(page, '11-offline');
    await page.click('.ev[data-open="fre-alexandra"], .item-main[data-open="fre-alexandra"]');
    await page.waitForSelector('.sheet-root.is-open');
    await page.click('.d-actions a[href*="maps/search"]');
    await page.waitForTimeout(200);
    assert.ok((await page.textContent('#toast')).includes('offline'));
    await ctx.setOffline(false);
  });

  await check('ingen JS-fejl', async () => assert.deepEqual(errors.filter((e) => !/net::ERR_INTERNET_DISCONNECTED|Failed to load resource/.test(e)), []));
  await ctx.close();
}

// ------------------------------------------------- Lys tilstand + nedtælling
{
  const { ctx, page } = await newPage({ scheme: 'light', nu: '2026-10-12T09:00' });
  await check('før festivalen: torsdag + nedtælling', async () => {
    assert.equal(await page.getAttribute('.daytab.is-active', 'data-day'), 'tor');
    await shot(page, '12-lys-kalender');
    await page.click('.navbtn[data-tab="nu"]');
    const txt = await page.textContent('.countdown');
    assert.ok(txt.includes('3') && txt.includes('dage'), txt);
  });
  await shot(page, '13-lys-nedtaelling');
  await ctx.close();
}

// -------------------------------------------------------- Tablet / desktop
{
  const { ctx, page } = await newPage({ width: 1024, height: 768, nu: '2026-10-17T12:10' });
  await check('desktop: centreret kolonne maks. 480 px', async () => {
    const w = await page.$eval('#app', (e) => e.getBoundingClientRect().width);
    assert.ok(w <= 480);
    await noHorizontalScroll(page);
  });
  await shot(page, '14-desktop');
  await ctx.close();
}

await browser.close();
let failed = 0;
for (const [s, name, msg] of results) {
  console.log(`${s.padEnd(4)} ${name}${msg ? `\n     ${msg}` : ''}`);
  if (s !== 'ok') failed++;
}
console.log(`\n${results.length - failed}/${results.length} ok`);
process.exit(failed ? 1 : 0);
