const FRONT_SHEET = process.env.BIBLE365_FRONT_SHEET || '성경365_일일5_Front_Bridge';

function parseCsv(text) {
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i += 1; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''; }
    else cell += ch;
  }
  if (cell.length || row.length) { row.push(cell.replace(/\r$/, '')); rows.push(row); }
  return rows.filter(r => r.some(v => v !== ''));
}

function seoulDay() {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return `${map.year}-${map.month}-${map.day}`;
}async function loadRecords() {
  const id = String(process.env.BIBLE365_SPREADSHEET_ID || '').trim();
  if (!id) throw new Error('BIBLE365_SPREADSHEET_ID_NOT_CONFIGURED');
  const url = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(id)}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(FRONT_SHEET)}&t=${Date.now()}`;
  const response = await fetch(url, { cache: 'no-store', redirect: 'follow' });
  if (!response.ok) throw new Error(`GVIZ_HTTP_${response.status}`);
  const rows = parseCsv(await response.text());
  if (rows.length < 1) return [];
  const headers = rows[0].map(v => v.trim());
  return rows.slice(1).map(values => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = values[i] ?? ''; });
    return obj;
  });
}

function readyRows(records) {
  return records.filter(r => String(r.READY_YN).toUpperCase() === 'Y' && String(r.RUNTIME_STATE) === 'LIVE_READY');
}

function latestDay(records) {
  const days = readyRows(records).map(r => String(r.DATE || '').match(/\d{4}-\d{2}-\d{2}/)?.[0]).filter(Boolean).sort();
  return days.length ? days[days.length - 1] : seoulDay();
}function buildPayload(records, dayKey) {
  const rows = readyRows(records).filter(r => String(r.DATE || '').includes(dayKey)).sort((a, b) => Number(a.SLOT || 0) - Number(b.SLOT || 0));
  const items = rows.map(r => ({
    slot: Number(r.SLOT || 0),
    id: String(r.PACKAGE_ID || ''),
    situation: `${String(r.PERSONA_NAME || '')} · ${String(r.TITLE || '')}`,
    dry: { title: String(r.TITLE || ''), body: String(r.BODY || '') },
    devotion: { title: String(r.TITLE || ''), body: String(r.BODY || '') },
    merged: String(r.BODY || ''),
    audio: {},
    tags: String(r.TAGS || '').split(',').map(v => v.trim()).filter(Boolean),
    status: String(r.RUNTIME_STATE || ''),
    bible: { ref: String(r.BIBLE_REF || ''), text: String(r.BIBLE_TEXT || '') },
    youtube: String(r.YOUTUBE_SCRIPT || ''),
    createdAt: String(r.UPDATED_AT || '')
  }));
  return { success: true, dayKey, items, updatedAt: new Date().toISOString(), meta: { source: 'CANONICAL_SHEET_GVIZ_SERVER_ONLY', target: 5, produced: items.length, publishMode: 'DRAFT_ONLY' } };
}

function send(res, callback, status, payload) {
  res.statusCode = status;
  res.setHeader('Cache-Control', 'no-store');
  if (callback && /^[A-Za-z_$][A-Za-z0-9_$.]*$/.test(callback)) {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.end(`${callback}(${JSON.stringify(payload)});`);
  } else {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(payload));
  }
}export default async function handler(req, res) {
  const q = req.query || {};
  const callback = typeof q.callback === 'string' ? q.callback : '';
  try {
    const records = await loadRecords();
    if (String(q.ping || '') === '1') {
      const dayKey = seoulDay();
      const payload = buildPayload(records, dayKey);
      return send(res, callback, 200, { success: true, ok: payload.items.length === 5, dayKey, produced: payload.items.length });
    }
    const type = String(q.type || 'daily5_today').toLowerCase();
    let dayKey;
    if (type === 'daily5_today') dayKey = seoulDay();
    else if (type === 'daily5_latest') dayKey = latestDay(records);
    else if (type === 'daily5_day') dayKey = String(q.dayKey || q.date || '');
    else if (type === 'daily5_health') {
      const today = seoulDay();
      const payload = buildPayload(records, today);
      return send(res, callback, 200, { success: true, ok: payload.items.length === 5, dayKey: today, produced: payload.items.length, ready: payload.items.length === 5 });
    } else return send(res, callback, 400, { success: false, error: 'UNSUPPORTED_READ_TYPE' });
    return send(res, callback, 200, buildPayload(records, dayKey));
  } catch (error) {
    return send(res, callback, 503, { success: false, error: String(error?.message || error), items: [] });
  }
}
