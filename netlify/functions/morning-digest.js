const { sendToSubscriptions, rowsGet, pushSubsGet } = require('./_lib/push');

// API skema baris v3 (sama dengan yang dipakai adapter di dag-perencanaan.html)
const API_URL = process.env.DAG_API_URL ||
  'https://script.google.com/macros/s/AKfycbxdn6qgVpneBOjQel3AquFPLajFXNHd34FPfi1OID7uZVtpgs1Kv0l-PIrvNs9aXxqByw/exec';
const APP_URL = process.env.DAG_APP_URL || 'https://dagstudiodesignschedule.netlify.app/';

function todayISO() {
  // Jakarta = UTC+7, function berjalan di UTC
  const now = new Date(Date.now() + 7 * 60 * 60 * 1000);
  return now.toISOString().slice(0, 10);
}

async function run() {
  const dateISO = todayISO();
  const [dailyItems, subs] = await Promise.all([
    rowsGet(API_URL, 'DAILY_ITEMS').catch(() => []),
    pushSubsGet(API_URL).catch(() => [])
  ]);

  const items = Array.isArray(dailyItems) ? dailyItems.filter(d => d.date === dateISO) : [];

  let body;
  if (!items.length) {
    body = 'Belum ada item Rencana Harian untuk hari ini. Cek Kanban Prioritas untuk susun job desk tim.';
  } else {
    const byPic = {};
    items.forEach(i => {
      const pic = i.pic || 'Belum ada PIC';
      byPic[pic] = (byPic[pic] || 0) + 1;
    });
    const lines = Object.entries(byPic).map(([pic, n]) => `${pic}: ${n} item`);
    body = `${items.length} item kerja hari ini — ${lines.join(', ')}`;
  }

  if (!subs.length) return { statusCode: 200, body: 'Tidak ada subscriber terdaftar.' };

  const result = await sendToSubscriptions(subs, {
    title: 'Job desk hari ini — DAG Studio',
    body,
    url: APP_URL
  });

  return { statusCode: 200, body: JSON.stringify(result) };
}

module.exports.run = run;
module.exports.handler = async () => {
  try {
    return await run();
  } catch (e) {
    return { statusCode: 500, body: 'Gagal kirim digest pagi: ' + e.message };
  }
};

// Jadwal: 00:00 UTC = 07:00 WIB, Senin—Sabtu
module.exports.config = { schedule: '0 0 * * 1-6' };
