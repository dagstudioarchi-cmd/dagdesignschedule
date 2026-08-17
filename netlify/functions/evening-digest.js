const { sendToSubscriptions, sheetGet } = require('./_lib/push');

const SYNC_URL = process.env.DAG_SYNC_URL ||
  'https://script.google.com/macros/s/AKfycby3KgsmeC7z1kAMZ6nnhGhMviUlWQcxen5azluTiN93PWRgjr4A3wWrJpmT0EwwvVnPEw/exec';
const APP_URL = process.env.DAG_APP_URL || 'https://dagstudiodesignschedule.netlify.app/';

function todayISO() {
  const now = new Date(Date.now() + 7 * 60 * 60 * 1000);
  return now.toISOString().slice(0, 10);
}

async function run() {
  const dateISO = todayISO();
  const [dailyReports, dailyItems, subscriptions] = await Promise.all([
    sheetGet(SYNC_URL, 'dag-daily-reports').catch(() => []),
    sheetGet(SYNC_URL, 'dag-daily-items').catch(() => []),
    sheetGet(SYNC_URL, 'dag-push-subs').catch(() => [])
  ]);

  const items = Array.isArray(dailyItems) ? dailyItems.filter(d => d.date === dateISO) : [];
  if (!items.length) return { statusCode: 200, body: 'Tidak ada item hari ini, skip reminder.' };

  const reportsList = Array.isArray(dailyReports) ? dailyReports : [];
  const already = reportsList.find(r => r.date === dateISO);
  if (already) return { statusCode: 200, body: 'Laporan sore sudah masuk, tidak perlu reminder.' };

  const subs = Array.isArray(subscriptions) ? subscriptions.map(s => s.subscription).filter(Boolean) : [];
  if (!subs.length) return { statusCode: 200, body: 'Tidak ada subscriber terdaftar.' };

  const result = await sendToSubscriptions(subs, {
    title: 'Laporan sore belum masuk — DAG Studio',
    body: `${items.length} item kerja hari ini, laporan sore belum dikirim. Cek Rencana Harian.`,
    url: APP_URL
  });

  return { statusCode: 200, body: JSON.stringify(result) };
}

module.exports.run = run;
module.exports.handler = async () => {
  try {
    return await run();
  } catch (e) {
    return { statusCode: 500, body: 'Gagal kirim reminder sore: ' + e.message };
  }
};

// Jadwal: 10:30 UTC = 17:30 WIB, Senin—Sabtu
module.exports.config = { schedule: '30 10 * * 1-6' };
