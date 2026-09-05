/* Hand Cricket Pro service worker.
   The whole game is static + localStorage, so it already works offline — this
   just makes it *installable* and stops a flaky connection from re-downloading
   the shell on every launch.

   Strategy:
     - navigation + same-origin static files: network first, cache fallback
       (so a deploy is picked up on the next load, not the one after)
     - never cache /api/* — those are live reads (friends, leaderboard, profile)
     - third-party (fonts, PeerJS, GA) cache-only-after-first-success, because
       we cannot verify them when offline anyway */

const VERSION = 'hc-2.9.0';
const SHELL = [
  '/',
  '/index.html',
  '/css/app.css',
  '/manifest.webmanifest',
  '/img/icon-192.png',
  '/img/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Never intercept API calls — friends, leaderboard, profile and save must
  // always hit the network, and a cached 403 would be a nightmare to debug.
  if (url.pathname.startsWith('/api/')) return;

  const sameOrigin = url.origin === self.location.origin;

  if (req.mode === 'navigate' || sameOrigin) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() =>
          caches.match(req).then((hit) => hit || caches.match('/index.html')),
        ),
    );
    return;
  }

  // Third-party: serve from cache when offline, refresh in the background.
  e.respondWith(
    caches.match(req).then((hit) => {
      const fetchPromise = fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => hit);
      return hit || fetchPromise;
    }),
  );
});
