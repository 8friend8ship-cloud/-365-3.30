import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

function resolvePublicOrigin(env: Record<string, string>) {
  const explicit = (env.APP_URL || '').trim().replace(/\/$/, '');
  if (explicit) return explicit;

  const vercelHost = (env.VERCEL_URL || env.VERCEL_PROJECT_PRODUCTION_URL || '').trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
  if (vercelHost) return `https://${vercelHost}`;

  return 'http://localhost:3000';
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const publicOrigin = resolvePublicOrigin(env);
  const canonicalGateway = `${publicOrigin}/api/bible365/engine`;

  return {
    plugins: [react(), tailwindcss()],
    define: {
      // Compatibility values consumed by the audited PR#2 App.tsx.
      // They contain no private Apps Script URL/id/token: all traffic terminates at this same-origin server.
      'import.meta.env.VITE_BIBLE_ENGINE_URL': JSON.stringify(canonicalGateway),
      'import.meta.env.VITE_DELIVERY_ENGINE_URL': JSON.stringify(canonicalGateway),
      'import.meta.env.VITE_BIBLE_SPREADSHEET_ID': JSON.stringify('server-managed'),
      'import.meta.env.VITE_BIBLE_EDITOR_ID': JSON.stringify(''),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
