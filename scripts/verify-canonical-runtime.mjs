import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const targets = ['src', 'public'];
const explicitFiles = ['vite.config.ts'];
const forbidden = [
  { pattern: /VITE_ACCESS_TOKEN/g, label: 'browser access token env' },
  { pattern: /bible2026secret/g, label: 'hardcoded legacy token' },
  { pattern: /script\.google\.com\/macros\/s\//g, label: 'direct Apps Script URL in browser bundle' },
  { pattern: /1HK4ATRZ-lSZ4fyuZi4ypHodgGZK1kBMsEFkAxOm9904/g, label: 'canonical spreadsheet id in browser bundle' },
  { pattern: /109430604282542310163/g, label: 'editor id in browser bundle' },
  { pattern: /process\.env\.GEMINI_API_KEY/g, label: 'Gemini key injected into browser build' },
  { pattern: /import\.meta\.env\.GEMINI_API_KEY/g, label: 'Gemini key consumed in browser source' },
  { pattern: /bots-git-feat-persona-language-[^'"\s]+\.vercel\.app/g, label: 'hardcoded preview Bots front URL' },
];

const extensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.html']);
const findings = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (extensions.has(path.extname(entry.name))) inspect(full);
  }
}

function inspect(file) {
  const text = fs.readFileSync(file, 'utf8');
  for (const rule of forbidden) {
    rule.pattern.lastIndex = 0;
    if (rule.pattern.test(text)) findings.push(`${path.relative(root, file)}: ${rule.label}`);
  }
}

function requireText(file, pattern, label) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) {
    findings.push(`${file}: missing required canonical file`);
    return;
  }
  const text = fs.readFileSync(full, 'utf8');
  pattern.lastIndex = 0;
  if (!pattern.test(text)) findings.push(`${file}: missing ${label}`);
}

for (const target of targets) walk(path.join(root, target));
for (const file of explicitFiles) {
  const full = path.join(root, file);
  if (fs.existsSync(full)) inspect(full);
}

// Positive architecture assertions: compatibility env names are allowed only when
// Vite pins them to our same-origin gateway and server-managed placeholders.
requireText('vite.config.ts', /\/api\/bible365\/engine/, 'same-origin Bible365 engine gateway');
requireText('vite.config.ts', /server-managed/, 'server-managed browser placeholder');
requireText('server.ts', /app\.get\(['"]\/api\/bible365\/engine['"]/, 'canonical engine server route');
requireText('server.ts', /BIBLE365_ENGINE_WEBAPP_URL/, 'server-only Apps Script engine env');
requireText('server.ts', /BIBLE365_ACCESS_TOKEN/, 'server-only access token env');
requireText('server.ts', /safeCallbackName/, 'safe JSONP compatibility validation');
requireText('src/main.tsx', /Bible365EntryShell/, 'Bible365 landing/bot entry shell mount');
requireText('src/components/Bible365EntryShell.tsx', /VITE_BOTS_FRONT_URL/, 'configurable public Bots front URL');
requireText('src/components/Bible365EntryShell.tsx', /Bible365 landing/, 'Bible365 landing entry');

if (findings.length) {
  console.error('BIBLE365_CANONICAL_GATE_FAIL');
  for (const finding of findings) console.error(`- ${finding}`);
  console.error('Front must terminate at same-origin /api/bible365/* only; private ids/secrets remain server-side.');
  process.exit(1);
}

console.log('BIBLE365_CANONICAL_GATE_PASS');