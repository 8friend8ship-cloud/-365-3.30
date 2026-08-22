import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// GAS WebApp URL and server-only token. Never expose this with a VITE_ prefix.
const WEBAPP_URL =
  process.env.AUDIO_WEBAPP_BASE_URL ||
  'https://script.google.com/macros/s/AKfycbwlsqwtVAm4DEU5ugDgleVKxOs2_HECqiOnbLTiLR74Pd25QzNITPjCaHr-llSrG-1Z/exec';
const ACCESS_TOKEN = process.env.BIBLE365_ACCESS_TOKEN || '';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Audio proxy keeps the Apps Script token on the server.
  app.get('/api/audio-proxy', async (req, res) => {
    const fileId = req.query.id as string;

    if (!fileId) {
      res.status(400).json({ error: 'Missing fileId' });
      return;
    }
    if (!ACCESS_TOKEN) {
      res.status(503).json({ error: 'Bible365 server token is not configured' });
      return;
    }

    try {
      const gasUrl = new URL(WEBAPP_URL);
      gasUrl.searchParams.set('type', 'audio_json');
      gasUrl.searchParams.set('id', fileId);
      gasUrl.searchParams.set('token', ACCESS_TOKEN);

      console.log(`[Proxy] Fetching audio from GAS: ${fileId}`);
      const response = await fetch(gasUrl);
      if (!response.ok) {
        throw new Error(`GAS responded with ${response.status}`);
      }

      const data = await response.json();
      if (!data.success || !data.dataUri) {
        throw new Error(data.message || 'Invalid response from GAS');
      }

      const matches = data.dataUri.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        throw new Error('Invalid data URI format');
      }

      const mimeType = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Length', buffer.length);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.send(buffer);
    } catch (error: any) {
      console.error('[Proxy] Error:', error.message);
      res.status(500).json({ error: 'Failed to fetch audio' });
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
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
