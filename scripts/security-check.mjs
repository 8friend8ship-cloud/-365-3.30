import { readFileSync } from 'node:fs';

const files = {
  aiLab: readFileSync('src/components/AILab.tsx', 'utf8'),
  service: readFileSync('src/services/aiService.ts', 'utf8'),
  vite: readFileSync('vite.config.ts', 'utf8'),
};

const combined = Object.values(files).join('\n');
const checks = [
  ['no browser SDK import', !combined.includes('@google/genai')],
  ['no browser SDK constructor', !combined.includes('GoogleGenAI')],
  ['no direct model call', !combined.includes('.models.generateContent')],
  ['no Gemini key reference', !combined.includes('GEMINI_API_KEY')],
  ['no browser key bundle define', !files.vite.includes("'process.env.GEMINI_API_KEY'")],
  ['audited kill-switch marker', files.aiLab.includes('DIRECT_BROWSER_AI_DISABLED')],
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
