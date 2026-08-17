// Netlify Function: suggest-pic
// Dipanggil dari dag-perencanaan.html (tombol "🤖 Sarankan PIC") untuk minta saran
// penugasan PIC ke Claude berdasarkan beban kerja tim saat ini + nama item kerja.
// Kalau ANTHROPIC_API_KEY belum diisi di Environment Variables Netlify, function ini
// akan mengembalikan error 500 dan app otomatis jatuh ke saran rule-based (lihat
// suggestPicWithAI() di dag-perencanaan.html) -- jadi aman kalau belum di-setup.

exports.handler = async (event) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: cors, body: 'Method not allowed' };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, headers: cors, body: 'ANTHROPIC_API_KEY belum diatur di Environment Variables Netlify.' };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, headers: cors, body: 'Invalid JSON' };
  }

  const { itemName, candidates } = payload;
  if (!Array.isArray(candidates) || !candidates.length) {
    return { statusCode: 400, headers: cors, body: 'candidates kosong' };
  }

  const candidateLines = candidates.map(c =>
    `- ${c.pic}: beban ${c.level}, ${c.activeTaskCount} tahapan Gantt aktif, ${c.openDailyItems} item kerja hari ini belum selesai`
  ).join('\n');

  const systemPrompt = `Kamu adalah asisten pembagian tugas untuk DAG Studio, studio arsitektur/interior/konstruksi kecil.
Diberi daftar anggota tim beserta beban kerja mereka saat ini, tugas kamu: sarankan SATU nama PIC paling tepat untuk item kerja baru, dengan mempertimbangkan beban kerja paling ringan dulu.
Kalau SEMUA anggota tim berbeban "Tinggi", tetap pilih satu yang paling ringan tapi tandai overloaded=true dan sarankan pertimbangkan tim lain/freelance di field reason.
Balas HANYA dengan JSON valid, tanpa markdown, format persis: {"pic":"<nama persis dari daftar>","reason":"<alasan singkat 1 kalimat, bahasa Indonesia>","overloaded":true|false}`;

  const userPrompt = `Item kerja baru: "${itemName || '(tidak ada nama spesifik)'}"\n\nBeban kerja tim saat ini:\n${candidateLines}\n\nSiapa PIC yang paling tepat menerima item ini?`;

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 300,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      })
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return { statusCode: 502, headers: cors, body: 'Anthropic API error: ' + errText };
    }

    const data = await resp.json();
    const textBlock = (data.content || []).find(b => b.type === 'text');
    const raw = textBlock ? textBlock.text.trim() : '';
    const cleaned = raw.replace(/```json|```/g, '').trim();
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      return { statusCode: 502, headers: cors, body: 'Gagal parse respon Claude.' };
    }

    const validPic = candidates.find(c => c.pic === parsed.pic);
    return {
      statusCode: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pic: validPic ? parsed.pic : candidates[0].pic,
        reason: parsed.reason || '',
        overloaded: !!parsed.overloaded
      })
    };
  } catch (e) {
    return { statusCode: 500, headers: cors, body: 'Gagal menghubungi Anthropic API: ' + e.message };
  }
};
