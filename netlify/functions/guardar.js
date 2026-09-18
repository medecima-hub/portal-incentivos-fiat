// Guarda el estado completo de una marca en Netlify Blobs.
// POST body JSON: { marca: "fiat", periodo: "2026-08", state: {...} }
// Guarda tres claves:
//  - "<marca>--current"        (siempre la última, para el link único)
//  - "<marca>--<periodo>"      (archivo histórico de ese mes)
//  - "<marca>--index"          (lista de períodos guardados, para el repositorio)
// Nota: el LIST nativo de Netlify Blobs no está disponible con las credenciales
// "edge" que recibe esta función (event.blobs), así que mantenemos nosotros
// mismos ese índice en vez de depender de esa API.
const STORE = 'incentivos-portal';

function getBlobsCreds(event) {
  const raw = event.blobs;
  if (!raw) throw new Error('Netlify Blobs no está disponible en esta función (event.blobs vacío). Revisá que el sitio tenga Blobs habilitado.');
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

async function blobsPut(creds, key, value) {
  const url = new URL(`/${creds.siteID}/${STORE}/${encodeURIComponent(key)}`, creds.edgeURL).toString();
  const res = await fetch(url, {
    method: 'PUT',
    headers: { authorization: `Bearer ${creds.token}` },
    body: JSON.stringify(value),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Netlify Blobs PUT falló (${res.status}): ${body.slice(0, 300)}`);
  }
}

exports.handler = async (event) => {
  const headers = { 'content-type': 'application/json' };
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ ok: false, error: 'Método no permitido' }) };
  }
  try {
    const creds = getBlobsCreds(event);
    const body = JSON.parse(event.body || '{}');
    const marca = String(body.marca || '').trim().toLowerCase();
    const periodo = body.periodo ? String(body.periodo).trim() : '';
    const state = body.state;
    if (!marca || !state) {
      return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'Falta marca o state' }) };
    }
    const payload = { savedAt: new Date().toISOString(), periodo, state };
    await blobsPut(creds, `${marca}--current`, payload);
    if (periodo) {
      await blobsPut(creds, `${marca}--${periodo}`, payload);
      const indexKey = `${marca}--index`;
      const existing = (await blobsGet(creds, indexKey)) || { periodos: [] };
      const periodos = Array.isArray(existing.periodos) ? existing.periodos.slice() : [];
      if (!periodos.includes(periodo)) periodos.push(periodo);
      periodos.sort().reverse();
      await blobsPut(creds, indexKey, { periodos });
    }
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: String((err && err.message) || err) }) };
  }
};
