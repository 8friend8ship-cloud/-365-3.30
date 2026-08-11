import { readFileSync } from 'node:fs';

const files = {
  app: readFileSync('src/App.tsx', 'utf8'),
  aiLab: readFileSync('src/components/AILab.tsx', 'utf8'),
  service: readFileSync('src/services/aiService.ts', 'utf8'),
  vite: readFileSync('vite.config.ts', 'utf8'),
};

const aiSurface = [files.aiLab, files.service, files.vite].join('\n');
const checks = [
  ['no browser SDK import', !aiSurface.includes('@google/genai')],
  ['no browser SDK constructor', !aiSurface.includes('GoogleGenAI')],
  ['no direct model call', !aiSurface.includes('.models.generateContent')],
  ['no Gemini key reference', !aiSurface.includes('GEMINI_API_KEY')],
  ['no browser key bundle define', !files.vite.includes("'process.env.GEMINI_API_KEY'")],
  ['audited AI kill-switch marker', files.aiLab.includes('DIRECT_BROWSER_AI_DISABLED')],
  ['no hardcoded Apps Script route', !files.app.includes('script.google.com/macros/s/')],
  ['no browser access-token env', !files.app.includes('VITE_ACCESS_TOKEN')],
  ['no browser token query parameter', !files.app.includes("searchParams.set('token'")],
  ['no legacy fallback secret', !files.app.includes('bible2026secret')],
  ['no hardcoded spreadsheet id', !files.app.includes('1HK4ATRZ-lSZ4fyuZi4ypHodgGZK1kBMsEFkAxOm9904')],
  ['no hardcoded editor id', !files.app.includes('109430604282542310163')],
  ['deployment-configured engine route', files.app.includes('VITE_BIBLE_ENGINE_URL')],
  ['safe missing-config guard', files.app.includes('ENGINE_CONFIG_ERROR')],
];

for (const [name, passed] of checks) {
  if (!passed) {
    console.error(`FAIL: ${name}`);
    process.exitCode = 1;
  }
}

if (!process.exitCode) {
  console.log(`security-check: ${checks.length}/${checks.length} passed`);
}
