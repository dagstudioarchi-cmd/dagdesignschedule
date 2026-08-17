const { sendToSubscriptions } = require('./_lib/push');

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

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, headers: cors, body: 'Invalid JSON' };
  }

  const { subscriptions, title, body, url } = payload;
  if (!Array.isArray(subscriptions) || !subscriptions.length) {
    return { statusCode: 400, headers: cors, body: 'subscriptions kosong' };
  }

  try {
    const result = await sendToSubscriptions(subscriptions, { title, body, url });
    return {
      statusCode: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify(result)
    };
  } catch (e) {
    return { statusCode: 500, headers: cors, body: 'Push gagal: ' + e.message };
  }
};
