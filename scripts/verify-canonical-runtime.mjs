import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const targets = ['src', 'public'];
const forbidden = [
  { pattern: /VITE_ACCESS_TOKEN/g, label: 'browser access token env' },
  { pattern: /bible2026secret/g, label: 'hardcoded legacy token' },
  { pattern: /script\.google\.com\/macros\/s\//g, label: 'direct Apps Script URL in browser bundle' },
  { pattern: /1HK4ATRZ-lSZ4fyuZi4ypHodgGZK1kBMsEFkAxOm9904/g, label: 'canonical spreadsheet id in browser bundle' },
  { pattern: /109430604282542310163/g, label: 'editor id in browser bundle' },
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

for (const target of targets) walk(path.join(root, target));

if (findings.length) {
  console.error('BIBLE365_CANONICAL_GATE_FAIL');
  for (const finding of findings) console.error(`- ${finding}`);
  console.error('Front must use same-origin /api/bible365/* only. Secrets/IDs remain server-side.');
  process.exit(1);
}

console.log('BIBLE365_CANONICAL_GATE_PASS');
