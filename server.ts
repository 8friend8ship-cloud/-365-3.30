import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const READ_ACTIONS = new Set(['dashboard', 'mail', 'schedule', 'queue']);
const WRITE_ACTIONS = new Set(['create_task', 'mark_reviewed']);

function env(name: string): string {
  return String(process.env[name] || '').trim();
}

function coreConfig() {
  const endpoint = env('AGENT_CORE_ENDPOINT') || env('AGENT_MAIL_ENDPOINT');
  const token = env('AGENT_CORE_TOKEN') || env('AGENT_MAIL_TOKEN');
  if (!endpoint || !token) throw new Error('AGENT_CORE_ENDPOINT/TOKEN이 없습니다.');
  return { endpoint, token };
}

function boundedLimit(value: unknown): number {
  const parsed = Number(value ?? 50);
  if (!Number.isFinite(parsed)) return 50;
  return Math.min(Math.max(Math.trunc(parsed), 1), 200);
}

async function proxyAgentGet(action: string, limit: number) {
  const { endpoint, token } = coreConfig();
  const target = new URL(endpoint);
  target.searchParams.set('action', action);
  target.searchParams.set('limit', String(limit));
  target.searchParams.set('token', token);
  const response = await fetch(target, { cache: 'no-store' });
  const text = await response.text();
  if (!response.ok) throw new Error(text || `Apps Script 오류 (${response.status})`);
  return text;
}

async function proxyFrontAnswer(query: Record<string, unknown>) {
  const { endpoint, token } = coreConfig();
  const target = new URL(endpoint);
  target.searchParams.set('action', 'front_answer');
  target.searchParams.set('appId', String(query.appId || 'BIBLE365_FRONT'));
  target.searchParams.set('query', String(query.query || ''));
  target.searchParams.set('intent', String(query.intent || ''));
  target.searchParams.set('locale', String(query.locale || 'ko-KR'));
  target.searchParams.set('market', String(query.market || 'KR'));
  target.searchParams.set('sessionId', String(query.sessionId || ''));
  target.searchParams.set('token', token);
  const response = await fetch(target, { cache: 'no-store' });
  const text = await response.text();
  if (!response.ok) throw new Error(text || `Front answer 오류 (${response.status})`);
  return text;
}

async function proxyAgentPost(body: Record<string, unknown>) {
  const { endpoint, token } = coreConfig();
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, token }),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(text || `Apps Script 오류 (${response.status})`);
  return text;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/front-answer', async (req, res) => {
    if (!String(req.query.query || '').trim()) return res.status(400).json({ ok: false, error: 'query가 필요합니다.' });
    try {
      const text = await proxyFrontAnswer(req.query as Record<string, unknown>);
      res.setHeader('Cache-Control', 'private, max-age=60');
      return res.status(200).type('application/json').send(text);
    } catch (error) {
      const message = error instanceof Error ? error.message : '프런트 답변 오류';
      return res.status(500).json({ ok: false, error: message });
    }
  });

  app.get('/api/agent/:action', async (req, res) => {
    const action = String(req.params.action || '').toLowerCase();
    if (!READ_ACTIONS.has(action)) return res.status(400).json({ ok: false, error: '지원하지 않는 조회 action입니다.' });
    try {
      const text = await proxyAgentGet(action, boundedLimit(req.query.limit));
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).type('application/json').send(text);
    } catch (error) {
      const message = error instanceof Error ? error.message : '작업큐 조회 오류';
      return res.status(500).json({ ok: false, error: message });
    }
  });

  app.post('/api/agent', async (req, res) => {
    const action = String(req.body?.action || '').toLowerCase();
    if (!WRITE_ACTIONS.has(action)) return res.status(400).json({ ok: false, error: '지원하지 않는 변경 action입니다.' });
    try {
      const text = await proxyAgentPost({ ...req.body, action });
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).type('application/json').send(text);
    } catch (error) {
      const message = error instanceof Error ? error.message : '작업큐 등록 오류';
      return res.status(500).json({ ok: false, error: message });
    }
  });

  app.get('/api/audio-proxy', async (req, res) => {
    const fileId = String(req.query.id || '');
    if (!fileId) return res.status(400).json({ error: 'Missing fileId' });
    const webAppUrl = env('BIBLE_GAS_WEBAPP_URL');
    const accessToken = env('BIBLE_GAS_ACCESS_TOKEN');
    if (!webAppUrl || !accessToken) return res.status(503).json({ error: 'Bible GAS environment is not configured' });
    try {
      const gasUrl = new URL(webAppUrl);
      gasUrl.searchParams.set('type', 'audio_json');
      gasUrl.searchParams.set('id', fileId);
      gasUrl.searchParams.set('token', accessToken);
      const response = await fetch(gasUrl);
      if (!response.ok) throw new Error(`GAS responded with ${response.status}`);
      const data = await response.json() as { success?: boolean; dataUri?: string; message?: string };
      if (!data.success || !data.dataUri) throw new Error(data.message || 'Invalid response from GAS');
      const matches = data.dataUri.match(/^data:([A-Za-z0-9.+/-]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) throw new Error('Invalid data URI format');
      const buffer = Buffer.from(matches[2], 'base64');
      res.setHeader('Content-Type', matches[1]);
      res.setHeader('Content-Length', buffer.length);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.send(buffer);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch audio';
      console.error('[Audio Proxy]', message);
      return res.status(500).json({ error: 'Failed to fetch audio', details: message });
    }
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
  app.listen(PORT, '0.0.0.0', () => console.log(`Server running on http://localhost:${PORT}`));
}

startServer().catch((error) => {
  console.error('Server failed to start:', error);
  process.exitCode = 1;
});
