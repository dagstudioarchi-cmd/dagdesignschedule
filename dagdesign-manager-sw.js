/**
 * DAG Studio — Service Worker untuk DAG Design Manager (desain)
 * Versi mandiri (tanpa Netlify / tanpa notifikasi push server).
 * Hanya menangani caching dasar untuk pemakaian offline/PWA.
 */
const CACHE = 'dagdesign-manager-v13'; // v13: rename dag-perencanaan.html -> dagdesign-manager.html

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.add(self.location.pathname.replace('dagdesign-manager-sw.js', 'dagdesign-manager.html'))).catch(() => {}));
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
