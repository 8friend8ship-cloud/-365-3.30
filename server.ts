import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// GAS WebApp URL and Token
const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwlsqwtVAm4DEU5ugDgleVKxOs2_HECqiOnbLTiLR74Pd25QzNITPjCaHr-llSrG-1Z/exec';
const ACCESS_TOKEN = process.env.VITE_ACCESS_TOKEN || 'bible2026secret';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // ✅ Audio Proxy Endpoint
  app.get('/api/audio-proxy', async (req, res) => {
    const fileId = req.query.id as string;
    
    if (!fileId) {
      res.status(400).json({ error: 'Missing fileId' });
      return;
    }

    try {
      // 1. Call GAS to get audio data (JSON with base64)
      const gasUrl = `${WEBAPP_URL}?type=audio_json&id=${fileId}&token=${ACCESS_TOKEN}`;
      console.log(`[Proxy] Fetching audio from GAS: ${fileId}`);
      
      const response = await fetch(gasUrl);
      if (!response.ok) {
        throw new Error(`GAS responded with ${response.status}`);
      }

      const data = await response.json();

      if (!data.success || !data.dataUri) {
        throw new Error(data.message || 'Invalid response from GAS');
      }

      // 2. Extract Base64 data
      // dataUri format: "data:audio/mp3;base64,SUQzBAAAAA..."
      const matches = data.dataUri.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      
      if (!matches || matches.length !== 3) {
        throw new Error('Invalid data URI format');
      }

      const mimeType = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');

      // 3. Stream audio to client
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Length', buffer.length);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      res.send(buffer);

    } catch (error: any) {
      console.error('[Proxy] Error:', error.message);
      res.status(500).json({ error: 'Failed to fetch audio', details: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static file serving
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
