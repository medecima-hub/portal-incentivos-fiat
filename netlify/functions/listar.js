// Lista los períodos guardados de una marca (para el "repositorio" de meses).
// GET ?marca=fiat -> { ok:true, periodos: ["2026-08", "2026-07", ...] }
const STORE = 'incentivos-portal';

function getBlobsCreds(event) {
  const raw = event.blobs;
  if (!raw) throw new Error('Netlify Blobs no está disponible en esta función (event.blobs vacío).');
  const info = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
  const siteID = event.headers && (event.headers['x-nf-site-id'] || event.headers['X-Nf-Site-Id']);
  if (!siteID || !info.url || !info.token) throw new Error('Faltan credenciales de Blobs (siteID/url/token).');
  return { siteID, edgeURL: info.url, token: info.token };
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
    const prefix = `${marca}--`;
    const listURL = new URL(`/${creds.siteID}/${STORE}`, creds.edgeURL).toString() + `?prefix=${encodeURIComponent(prefix)}`;
    const res = await fetch(listURL, { headers: { authorization: `Bearer ${creds.token}` } });
    if (!res.ok && res.status !== 404) {
      const body = await res.text().catch(() => '');
      throw new Error(`Netlify Blobs LIST falló (${res.status}): ${body.slice(0, 300)}`);
    }
    let periodos = [];
    if (res.status !== 404) {
      const page = await res.json();
      const blobs = (page && page.blobs) || [];
      periodos = blobs
        .map((b) => String(b.key || '').slice(prefix.length))
        .filter((p) => p && p !== 'current')
        .sort()
        .reverse();
    }
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, periodos }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: String((err && err.message) || err) }) };
  }
};
