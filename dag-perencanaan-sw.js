/**
 * DAG Studio — Service Worker untuk DAG Perencanaan (desain)
 * File nyata (bukan blob URL) supaya notifikasi push bisa membangunkan
 * service worker ini dengan andal walau app/tab sedang tertutup.
 */
const CACHE = 'dag-perencanaan-v11'; // dinaikkan 18 Agu 2026 - paksa ambil HTML baru (adapter skema baris)

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
  // Webhook Google Apps Script & panggilan Netlify Functions — selalu network, jangan di-cache.
  if (url.hostname.includes('script.google.com') || url.pathname.includes('/.netlify/functions/')) return;
  e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
});

self.addEventListener('push', (e) => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch (err) { data = { title: 'DAG Studio', body: e.data ? e.data.text() : '' }; }
  const title = data.title || 'DAG Studio';
  const options = {
    body: data.body || '',
    icon: '/dag-icon-192.png',
    badge: '/dag-icon-192.png',
    data: { url: data.url || '/perencanaan' }
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const targetUrl = (e.notification.data && e.notification.data.url) || '/perencanaan';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      for (const c of clientsArr) {
        if (c.url.includes(targetUrl) && 'focus' in c) return c.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
