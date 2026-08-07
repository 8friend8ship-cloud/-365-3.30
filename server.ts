import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const WEBAPP_URL = process.env.BIBLE365_GAS_WEBAPP_URL?.trim();
const ACCESS_TOKEN = process.env.BIBLE365_ACCESS_TOKEN?.trim();

function hasRuntimeConfig(): boolean {
  return Boolean(WEBAPP_URL && ACCESS_TOKEN);
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  app.get('/api/health', (_req, res) => {
    res.status(hasRuntimeConfig() ? 200 : 503).json({
      ok: hasRuntimeConfig(),
      service: 'bible365-front-proxy',
      runtimeConfigured: hasRuntimeConfig(),
    });
  });

  app.get('/api/audio-proxy', async (req, res) => {
    if (!hasRuntimeConfig()) {
      res.status(503).json({
        error: 'Bible365 runtime configuration is missing.',
        required: ['BIBLE365_GAS_WEBAPP_URL', 'BIBLE365_ACCESS_TOKEN'],
      });
      return;
    }

    const fileId = req.query.id as string;
    if (!fileId) {
      res.status(400).json({ error: 'Missing fileId' });
      return;
    }

    try {
      const gasUrl = new URL(WEBAPP_URL!);
      gasUrl.searchParams.set('type', 'audio_json');
      gasUrl.searchParams.set('id', fileId);
      gasUrl.searchParams.set('token', ACCESS_TOKEN!);

      const response = await fetch(gasUrl);
      if (!response.ok) {
        throw new Error(`GAS responded with ${response.status}`);
      }

      const data = await response.json();
      if (!data.success || !data.dataUri) {
        throw new Error(data.message || 'Invalid response from GAS');
      }

      const matches = data.dataUri.match(/^data:([A-Za-z0-9.+/-]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        throw new Error('Invalid data URI format');
      }

      const mimeType = matches[1];
      const buffer = Buffer.from(matches[2], 'base64');

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Length', buffer.length);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(buffer);
    } catch (error: any) {
      console.error('[Audio Proxy] Error:', error.message);
      res.status(502).json({ error: 'Failed to fetch audio', details: error.message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Bible365 server running on port ${PORT}`);
  });
}

startServer();
