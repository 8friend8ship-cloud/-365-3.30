import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Bible365 canonical runtime gateway.
 *
 * Central-agent contract:
 * Front -> this server -> existing Bible1 canonical Apps Script -> Drive/Sheets backdata.
 * Browser code must never receive Apps Script credentials, spreadsheet ids, editor ids,
 * or private deployment urls. Legacy Bible2/Bible3 delivery sources remain read-only
 * migration/fallback sources behind the canonical Apps Script layer.
 */
const ENGINE_WEBAPP_URL = process.env.BIBLE365_ENGINE_WEBAPP_URL || '';
const DELIVERY_WEBAPP_URL = process.env.BIBLE365_DELIVERY_WEBAPP_URL || ENGINE_WEBAPP_URL;
const ACCESS_TOKEN = process.env.BIBLE365_ACCESS_TOKEN || '';
const SPREADSHEET_ID = process.env.BIBLE365_SPREADSHEET_ID || '';
const EDITOR_ID = process.env.BIBLE365_EDITOR_ID || '';

function assertCanonicalRuntimeConfigured() {
  const missing = [
    ['BIBLE365_ENGINE_WEBAPP_URL', ENGINE_WEBAPP_URL],
    ['BIBLE365_ACCESS_TOKEN', ACCESS_TOKEN],
    ['BIBLE365_SPREADSHEET_ID', SPREADSHEET_ID],
  ].filter(([, value]) => !value).map(([name]) => name);

  if (missing.length > 0) {
    const error = new Error(`Bible365 canonical runtime is not configured: ${missing.join(', ')}`);
    (error as any).statusCode = 503;
    throw error;
  }
}

function copyAllowedQuery(source: express.Request['query'], target: URL) {
  const allow = new Set([
    'type', 'ping', 'lang', 'id', 'text', 'content_type', 'dayKey', 'slot', 'locale', 'force',
  ]);
  for (const [key, raw] of Object.entries(source)) {
    if (!allow.has(key) || raw == null) continue;
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (typeof value === 'string') target.searchParams.set(key, value);
  }
}

async function fetchCanonicalGas(req: express.Request) {
  assertCanonicalRuntimeConfigured();
  const gasUrl = new URL(ENGINE_WEBAPP_URL);
  copyAllowedQuery(req.query, gasUrl);
  gasUrl.searchParams.set('token', ACCESS_TOKEN);
  gasUrl.searchParams.set('spreadsheetId', SPREADSHEET_ID);
  if (EDITOR_ID) gasUrl.searchParams.set('editorId', EDITOR_ID);
  gasUrl.searchParams.set('t', Date.now().toString());
  return fetch(gasUrl, { redirect: 'follow' });
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  app.disable('x-powered-by');

  // Canonical Bible365 content/voice gateway. Keeps all runtime ids and credentials server-side.
  app.get('/api/bible365/engine', async (req, res) => {
    try {
      const response = await fetchCanonicalGas(req);
      const body = await response.text();
      const contentType = response.headers.get('content-type') || 'application/json; charset=utf-8';
      res.status(response.status);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'no-store');
      res.send(body);
    } catch (error: any) {
      const status = error?.statusCode || 502;
      console.error('[Bible365 engine gateway]', error?.message || error);
      res.status(status).json({ success: false, error: 'BIBLE365_CANONICAL_GATEWAY_UNAVAILABLE' });
    }
  });

  // Audio proxy preserves the legacy audio-url advantage while hiding the delivery WebApp/token.
  app.get('/api/bible365/audio', async (req, res) => {
    const fileId = typeof req.query.id === 'string' ? req.query.id : '';
    if (!fileId) {
      res.status(400).json({ error: 'Missing fileId' });
      return;
    }

    try {
      assertCanonicalRuntimeConfigured();
      if (!DELIVERY_WEBAPP_URL) throw new Error('BIBLE365_DELIVERY_WEBAPP_URL is not configured');

      const gasUrl = new URL(DELIVERY_WEBAPP_URL);
      gasUrl.searchParams.set('type', 'audio_json');
      gasUrl.searchParams.set('id', fileId);
      gasUrl.searchParams.set('token', ACCESS_TOKEN);

      const response = await fetch(gasUrl, { redirect: 'follow' });
      if (!response.ok) throw new Error(`GAS responded with ${response.status}`);

      const data = await response.json() as { success?: boolean; dataUri?: string; message?: string };
      if (!data.success || !data.dataUri) throw new Error(data.message || 'Invalid audio response');

      const matches = data.dataUri.match(/^data:([A-Za-z0-9.+/-]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) throw new Error('Invalid data URI format');

      const mimeType = matches[1];
      const buffer = Buffer.from(matches[2], 'base64');
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Length', buffer.length);
      res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
      res.send(buffer);
    } catch (error: any) {
      console.error('[Bible365 audio gateway]', error?.message || error);
      res.status(502).json({ error: 'BIBLE365_AUDIO_GATEWAY_UNAVAILABLE' });
    }
  });

  // Compatibility alias for older front code during migration. New code should use /api/bible365/audio.
  app.get('/api/audio-proxy', (req, res) => {
    const query = new URLSearchParams();
    if (typeof req.query.id === 'string') query.set('id', req.query.id);
    res.redirect(307, `/api/bible365/audio?${query.toString()}`);
  });

  app.get('/api/bible365/runtime-status', (_req, res) => {
    const configured = Boolean(ENGINE_WEBAPP_URL && ACCESS_TOKEN && SPREADSHEET_ID);
    res.json({
      appId: 'APP_BIBLE365',
      canonicalRepo: '8friend8ship-cloud/-365-3.30',
      canonicalGroup: 'BIBLE365',
      mode: configured ? 'CANONICAL_SERVER_GATEWAY' : 'CONFIG_REQUIRED',
      configured,
      browserSecretExposure: false,
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Bible365 server running on port ${PORT}`);
  });
}

startServer();
