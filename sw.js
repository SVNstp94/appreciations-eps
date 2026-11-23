const CACHE = 'appreciations-eps-v1';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Réponse immédiate depuis le cache, mise à jour en arrière-plan quand le réseau est là.
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  const same = u.origin === self.location.origin;
  const font = u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com';
  if (!same && !font) return;
  const net = fetch(r).then(async res => {
    if (res && (res.ok || res.type === 'opaque')) { const c = await caches.open(CACHE); await c.put(r, res.clone()); }
    return res;
  });
  e.respondWith(caches.match(r, {ignoreSearch: same}).then(hit => hit || net));
  e.waitUntil(net.catch(() => {}));
});
