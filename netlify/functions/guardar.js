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

async function blobsDelete(creds, key) {
  const url = new URL(`/${creds.siteID}/${STORE}/${encodeURIComponent(key)}`, creds.edgeURL).toString();
  const res = await fetch(url, { method: 'DELETE', headers: { authorization: `Bearer ${creds.token}` } });
  if (!res.ok && res.status !== 404) {
    const body = await res.text().catch(() => '');
    throw new Error(`Netlify Blobs DELETE falló (${res.status}): ${body.slice(0, 300)}`);
  }
}

async function handlePost(event, creds, headers) {
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
}

// Borra un período guardado (por si se cargó mal un mes y hay que sacarlo
// del repositorio). No toca "current" — si el período borrado era el
// último guardado, "current" queda igual hasta el próximo guardado real.
async function handleDelete(event, creds, headers) {
  const qs = event.queryStringParameters || {};
  const marca = String(qs.marca || '').trim().toLowerCase();
  const periodo = qs.periodo ? String(qs.periodo).trim() : '';
  if (!marca || !periodo) {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'Falta marca o periodo' }) };
  }
  await blobsDelete(creds, `${marca}--${periodo}`);
  const indexKey = `${marca}--index`;
  const existing = await blobsGet(creds, indexKey);
  if (existing && Array.isArray(existing.periodos)) {
    const periodos = existing.periodos.filter((p) => p !== periodo);
    await blobsPut(creds, indexKey, { periodos });
  }
  return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
}

exports.handler = async (event) => {
  const headers = { 'content-type': 'application/json' };
  try {
    const creds = getBlobsCreds(event);
    if (event.httpMethod === 'POST') return await handlePost(event, creds, headers);
    if (event.httpMethod === 'DELETE') return await handleDelete(event, creds, headers);
    return { statusCode: 405, headers, body: JSON.stringify({ ok: false, error: 'Método no permitido' }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: String((err && err.message) || err) }) };
  }
};
