const webpush = require('web-push');

const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const CONTACT = process.env.VAPID_CONTACT_EMAIL || 'mailto:studio@dagstudio.id';

let configured = false;
function ensureConfigured() {
  if (configured) return;
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    throw new Error('VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY belum diset di environment variables Netlify.');
  }
  webpush.setVapidDetails(CONTACT, VAPID_PUBLIC, VAPID_PRIVATE);
  configured = true;
}

// Kirim satu notifikasi ke banyak subscription sekaligus.
// subscriptions: array of PushSubscription JSON (dari browser)
// payload: { title, body, url }
// Return: { sent, failedEndpoints } — failedEndpoints berguna untuk dibersihkan dari daftar subscriber.
async function sendToSubscriptions(subscriptions, payload) {
  ensureConfigured();
  const list = Array.isArray(subscriptions) ? subscriptions : [];
  if (!list.length) return { sent: 0, failedEndpoints: [] };

  const body = JSON.stringify({
    title: payload.title || 'DAG Studio',
    body: payload.body || '',
    url: payload.url || '/'
  });

  const results = await Promise.allSettled(
    list.map(sub => webpush.sendNotification(sub, body))
  );

  const failedEndpoints = [];
  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      // 404/410 artinya subscription sudah tidak valid (user uninstall/revoke) — layak dibersihkan.
      failedEndpoints.push(list[i] && list[i].endpoint);
    }
  });

  return { sent: list.length - failedEndpoints.length, failedEndpoints };
}

// Ambil data dari webhook Google Sheet yang sama dipakai oleh app (key-value store).
async function sheetGet(syncUrl, key) {
  const res = await fetch(`${syncUrl}?key=${encodeURIComponent(key)}&_t=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Gagal ambil data sheet untuk key: ' + key);
  const data = await res.json();
  if (!data || data.value === undefined || data.value === null) return null;
  try { return JSON.parse(data.value); } catch (e) { return data.value; }
}

// ---- SKEMA BARIS v3 (API baru) --------------------------------------------
// App memakai adapter skema baris: data tidak lagi ditumpuk 1 sel per key,
// tapi disimpan sebagai baris per tabel. Endpoint: ?action=read&table=NAMA
// Ini WAJIB dipakai untuk DAILY_ITEMS & PUSH_SUBS, kalau tidak digest terjadwal
// akan membaca data lama yang sudah tidak diisi lagi oleh app.
async function rowsGet(apiUrl, table) {
  const res = await fetch(`${apiUrl}?action=read&table=${encodeURIComponent(table)}&_t=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Gagal baca tabel: ' + table);
  const data = await res.json();
  if (!data || !data.ok) throw new Error((data && data.error) || ('Gagal baca tabel: ' + table));
  return (data.rows || []).filter(r => !r.deleted);
}

// PUSH_SUBS disimpan sebagai baris { id, endpoint, payload:<JSON string> }.
// Kembalikan array PushSubscription siap pakai untuk web-push.
async function pushSubsGet(apiUrl) {
  const rows = await rowsGet(apiUrl, 'PUSH_SUBS');
  return rows.map(r => {
    let obj = {};
    try { obj = JSON.parse(r.payload); } catch (e) { return null; }
    return obj && obj.subscription ? obj.subscription : obj;
  }).filter(s => s && s.endpoint);
}

module.exports = { sendToSubscriptions, sheetGet, rowsGet, pushSubsGet };
