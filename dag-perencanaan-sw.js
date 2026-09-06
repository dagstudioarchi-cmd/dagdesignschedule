/**
 * DAG Studio — Service Worker untuk DAG Perencanaan (desain)
 * Versi mandiri (tanpa Netlify / tanpa notifikasi push server).
 * Hanya menangani caching dasar untuk pemakaian offline/PWA.
 */
const CACHE = 'dag-perencanaan-v13'; // v12: lepas dari Netlify — push notification server dihapus

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.add(self.location.pathname.replace('dag-perencanaan-sw.js', 'dag-perencanaan.html'))).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // Webhook Google Apps Script & API eksternal lain — selalu network, jangan di-cache.
  if (url.hostname.includes('script.google.com') || url.hostname !== self.location.hostname) return;
  e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
});
