// Service worker: cache-first for alle app-filer, så appen virker offline.
// Hæv VERSION ved hver udgivelse – så hentes en ny, versioneret cache.
const VERSION = '2026-10-15.5';
const CACHE = `illusions-${VERSION}`;
const DATA_URL = new URL('data.js', self.registration.scope).href;

const ASSETS = [
  './',
  'index.html',
  'css/app.css',
  'js/app.js',
  'js/time.js',
  'js/layout.js',
  'js/ics.js',
  'js/icons.js',
  'js/sheet.js',
  'data.js',
  'manifest.webmanifest',
  'icons/favicon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/maskable-192.png',
  'icons/maskable-512.png',
  'icons/apple-touch-icon.png',
].map((p) => new URL(p, self.registration.scope).href);

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(ASSETS.map((url) => new Request(url, { cache: 'reload' })));
    // Første installation: tag over med det samme. Opdateringer venter på brugerens "Opdatér".
    if (!self.registration.active) await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('illusions-') && k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // fx Google Maps – går direkte på nettet

  if (req.mode === 'navigate') {
    event.respondWith(appShell(req));
    return;
  }
  if (url.href.split('?')[0] === DATA_URL) {
    event.respondWith(dataFirstFromCache(req, event));
    return;
  }
  event.respondWith(cacheFirst(req));
});

async function appShell(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(new URL('index.html', self.registration.scope).href);
  if (hit) return hit;
  try { return await fetch(req); } catch { return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }); }
}

async function cacheFirst(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req, { ignoreSearch: true });
  if (hit) return hit;
  try {
    const res = await fetch(req);
    if (res.ok && res.type === 'basic') cache.put(req, res.clone());
    return res;
  } catch {
    return new Response('', { status: 504, statusText: 'Offline' });
  }
}

// Programdata: svar straks fra cachen, og tjek i baggrunden om der er rettelser.
async function dataFirstFromCache(req, event) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(DATA_URL);
  const refresh = (async () => {
    try {
      const res = await fetch(DATA_URL, { cache: 'no-cache' });
      if (!res.ok) return null;
      const fresh = await res.clone().text();
      const old = hit ? await hit.clone().text() : null;
      if (fresh !== old) {
        await cache.put(DATA_URL, res.clone());
        if (old !== null) {
          const clients = await self.clients.matchAll({ type: 'window' });
          clients.forEach((c) => c.postMessage({ type: 'DATA_UPDATED' }));
        }
      }
      return res;
    } catch {
      return null;
    }
  })();
  if (hit) {
    event.waitUntil(refresh);
    return hit;
  }
  const res = await refresh;
  return res || new Response('', { status: 504, statusText: 'Offline' });
}
