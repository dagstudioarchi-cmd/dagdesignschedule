// Uji manual digest terjadwal lewat browser (scheduled function tidak bisa dipanggil via URL).
// Buka: https://<situs>/.netlify/functions/digest-test?which=pagi   atau   ?which=sore
// Mengirim push SUNGGUHAN ke semua subscriber — pakai seperlunya.
const pagi = require('./morning-digest');
const sore = require('./evening-digest');
exports.handler = async (event) => {
  const which = (event.queryStringParameters || {}).which || 'pagi';
  try {
    const r = await (which === 'sore' ? sore.run() : pagi.run());
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true, which, result: r && r.body ? r.body : r }) };
  } catch (e) {
    return { statusCode: 500, body: 'Gagal: ' + e.message };
  }
};
