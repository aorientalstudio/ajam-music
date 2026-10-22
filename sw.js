/* A STUDIO — service worker.
   Only the app shell (this page + icons) is kept, so the app opens fast and shows a clear
   "no internet" state. Songs, notes, the programs (app.dat / admin.dat) and the instrument samples are never stored here. */
const V = 'astudio-v5';
const SHELL = ['./', './manifest.json', './icons/icon-192.png', './icons/icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== self.location.origin) return;          // server, fonts, CDN: straight to the network
  if (r.mode === 'navigate') {                            // the page: always the newest copy, cache only as fallback
    e.respondWith(fetch(r).then(res => {
      if (res.ok && /\/(index\.html)?$/.test(u.pathname)) { const cp = res.clone(); caches.open(V).then(c => c.put('./', cp)); } return res;
    }).catch(() => caches.match('./')));
    return;
  }
  // everything else from this site (app.dat, icons): newest from the network, the cached copy only when offline
  e.respondWith(fetch(r).then(res => { if (res.ok && !u.search) { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); } return res; })
    .catch(() => caches.match(r, { ignoreSearch: true })));
});
