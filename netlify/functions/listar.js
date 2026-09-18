// Lista los períodos guardados de una marca (para el "repositorio" de meses).
// GET ?marca=fiat -> { ok:true, periodos: ["2026-08", "2026-07", ...] }
// Lee el índice que mantiene guardar.js en "<marca>--index" (no usamos el
// LIST nativo de Netlify Blobs: no está disponible con las credenciales
// "edge" que recibe esta función).
const STORE = 'incentivos-portal';

function getBlobsCreds(event) {
  const raw = event.blobs;
  if (!raw) throw new Error('Netlify Blobs no está disponible en esta función (event.blobs vacío).');
  const info = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
  const siteID = event.headers && (event.headers['x-nf-site-id'] || event.headers['X-Nf-Site-Id']);
  if (!siteID || !info.url || !info.token) throw new Error('Faltan credenciales de Blobs (siteID/url/token).');
  return { siteID, edgeURL: info.url, token: info.token };
}

async function blobsGet(creds, key) {
  const url = new URL(`/${creds.siteID}/${STORE}/${encodeURIComponent(key)}`, creds.edgeURL).toString();
  const res = await fetch(url, { headers: { authorization: `Bearer ${creds.token}` } });
  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Netlify Blobs GET falló (${res.status}): ${body.slice(0, 300)}`);
  }
  return res.json();
}

exports.handler = async (event) => {
  const headers = { 'content-type': 'application/json' };
  try {
    const creds = getBlobsCreds(event);
    const qs = event.queryStringParameters || {};
    const marca = String(qs.marca || '').trim().toLowerCase();
    if (!marca) {
      return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'Falta marca' }) };
    }
    const data = await blobsGet(creds, `${marca}--index`);
    const periodos = (data && Array.isArray(data.periodos)) ? data.periodos : [];
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, periodos }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: String((err && err.message) || err) }) };
  }
};
