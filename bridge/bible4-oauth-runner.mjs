import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import readline from 'node:readline/promises';
import process from 'node:process';

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(?:[A-Za-z]:)/, m => m.slice(1))), '..');
const runtime = path.join(repoRoot, '.bridge-runtime', 'bible4');
const secretDir = path.join(runtime, 'secrets');
const liveDir = path.join(runtime, 'live');
const tokenPath = path.join(secretDir, 'oauth-token.json');
const clientPath = path.join(secretDir, 'oauth-client.json');
const deploymentPath = path.join(runtime, 'api-deployment-id.txt');
const projectId = 'hd-central-agent-auto';

fs.mkdirSync(secretDir, { recursive: true });

function findDesktopClientJson() {
  if (fs.existsSync(clientPath)) return clientPath;
  const downloads = path.join(os.homedir(), 'Downloads');
  if (!fs.existsSync(downloads)) throw new Error(`Downloads 폴더를 찾지 못했습니다: ${downloads}`);
  const candidates = fs.readdirSync(downloads)
    .filter(n => n.toLowerCase().endsWith('.json'))
    .map(n => ({ p: path.join(downloads, n), m: fs.statSync(path.join(downloads, n)).mtimeMs }))
    .sort((a, b) => b.m - a.m);
  for (const c of candidates) {
    try {
      const j = JSON.parse(fs.readFileSync(c.p, 'utf8'));
      if (j?.installed?.client_id && j?.installed?.client_secret) {
        fs.copyFileSync(c.p, clientPath);
        console.log(`OAUTH_CLIENT_IMPORTED=${clientPath}`);
        return clientPath;
      }
    } catch {}
  }
  throw new Error('Downloads에서 데스크톱 OAuth JSON을 찾지 못했습니다. Google Cloud > 클라이언트 > HD Central Agent Local Bridge에서 JSON 다운로드 후 다시 실행하세요.');
}

function deriveScopes() {
  const codePath = path.join(liveDir, 'Code.js');
  const manifestPath = path.join(liveDir, 'appsscript.json');
  const scopes = new Set(['https://www.googleapis.com/auth/userinfo.email']);
  if (fs.existsSync(manifestPath)) {
    try {
      const m = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      for (const s of (m.oauthScopes || [])) scopes.add(s);
    } catch {}
  }
  const code = fs.existsSync(codePath) ? fs.readFileSync(codePath, 'utf8') : '';
  const map = [
    [/SpreadsheetApp|Sheets\./, 'https://www.googleapis.com/auth/spreadsheets'],
    [/DriveApp|Drive\./, 'https://www.googleapis.com/auth/drive'],
    [/UrlFetchApp/, 'https://www.googleapis.com/auth/script.external_request'],
    [/ScriptApp/, 'https://www.googleapis.com/auth/script.scriptapp'],
    [/MailApp/, 'https://www.googleapis.com/auth/script.send_mail'],
    [/GmailApp|Gmail\./, 'https://mail.google.com/'],
    [/DocumentApp|Docs\./, 'https://www.googleapis.com/auth/documents'],
    [/SlidesApp|Slides\./, 'https://www.googleapis.com/auth/presentations'],
    [/CalendarApp|Calendar\./, 'https://www.googleapis.com/auth/calendar'],
    [/YouTube\./, 'https://www.googleapis.com/auth/youtube'],
    [/YouTubeAnalytics\./, 'https://www.googleapis.com/auth/yt-analytics.readonly']
  ];
  for (const [re, scope] of map) if (re.test(code)) scopes.add(scope);
  return [...scopes];
}

async function getDeploymentId() {
  if (fs.existsSync(deploymentPath)) {
    const v = fs.readFileSync(deploymentPath, 'utf8').trim();
    if (v) return v;
  }
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const v = (await rl.question('Bible4 API 실행 파일 배포 ID를 붙여넣으세요: ')).trim();
  rl.close();
  if (!v) throw new Error('배포 ID가 비어 있습니다.');
  fs.writeFileSync(deploymentPath, v, 'utf8');
  return v;
}

function updateClaspProjectId() {
  const p = path.join(runtime, '.clasp.json');
  if (!fs.existsSync(p)) return;
  const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  if (j.projectId !== projectId) {
    j.projectId = projectId;
    fs.writeFileSync(p, JSON.stringify(j, null, 2), 'utf8');
    console.log(`CLASP_PROJECT_ID_SET=${projectId}`);
  }
}

async function refreshToken(client, token) {
  if (!token.refresh_token) return token;
  const body = new URLSearchParams({
    client_id: client.client_id,
    client_secret: client.client_secret,
    refresh_token: token.refresh_token,
    grant_type: 'refresh_token'
  });
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body });
  if (!r.ok) throw new Error(`토큰 갱신 실패 ${r.status}: ${await r.text()}`);
  const t = await r.json();
  return { ...token, ...t, refresh_token: token.refresh_token, obtained_at: Date.now() };
}

async function interactiveAuth(client, scopes) {
  const server = http.createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const redirectUri = `http://127.0.0.1:${port}`;
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', client.client_id);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');
  authUrl.searchParams.set('scope', scopes.join(' '));

  console.log('OAUTH_BROWSER_OPENING');
  if (process.platform === 'win32') await execFileAsync('cmd', ['/c', 'start', '', authUrl.toString()]);
  else if (process.platform === 'darwin') await execFileAsync('open', [authUrl.toString()]);
  else await execFileAsync('xdg-open', [authUrl.toString()]);

  const code = await new Promise((resolve, reject) => {
    server.on('request', (req, res) => {
      const u = new URL(req.url, redirectUri);
      if (u.searchParams.get('error')) {
        res.end('OAuth denied. You can close this tab.');
        server.close();
        reject(new Error(`OAuth denied: ${u.searchParams.get('error')}`));
        return;
      }
      const c = u.searchParams.get('code');
      res.end('HD Central Agent OAuth OK. You can close this tab and return to PowerShell.');
      server.close();
      resolve(c);
    });
  });
  if (!code) throw new Error('OAuth authorization code를 받지 못했습니다.');

  const body = new URLSearchParams({
    code,
    client_id: client.client_id,
    client_secret: client.client_secret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code'
  });
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body });
  if (!r.ok) throw new Error(`OAuth token 교환 실패 ${r.status}: ${await r.text()}`);
  return { ...(await r.json()), obtained_at: Date.now() };
}

async function getAccessToken(client, scopes) {
  let token = null;
  if (fs.existsSync(tokenPath)) {
    try { token = JSON.parse(fs.readFileSync(tokenPath, 'utf8')); } catch {}
  }
  if (token?.refresh_token) {
    token = await refreshToken(client, token);
  } else {
    token = await interactiveAuth(client, scopes);
  }
  fs.writeFileSync(tokenPath, JSON.stringify(token, null, 2), 'utf8');
  if (!token.access_token) throw new Error('access_token이 없습니다.');
  return token.access_token;
}

async function runFunction(deploymentId, accessToken, functionName, devMode = true) {
  const r = await fetch(`https://script.googleapis.com/v1/scripts/${encodeURIComponent(deploymentId)}:run`, {
    method: 'POST',
    headers: { authorization: `Bearer ${accessToken}`, 'content-type': 'application/json' },
    body: JSON.stringify({ function: functionName, devMode })
  });
  const text = await r.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!r.ok) throw new Error(`scripts.run HTTP ${r.status}: ${JSON.stringify(data)}`);
  if (data.error) throw new Error(`SCRIPT_EXECUTION_ERROR: ${JSON.stringify(data.error)}`);
  return data;
}

async function main() {
  console.log('=== Bible4 OAuth Execution Bridge ===');
  const p = findDesktopClientJson();
  const root = JSON.parse(fs.readFileSync(p, 'utf8'));
  const client = root.installed;
  updateClaspProjectId();
  const deploymentId = await getDeploymentId();
  const scopes = deriveScopes();
  console.log(`OAUTH_SCOPE_COUNT=${scopes.length}`);
  const accessToken = await getAccessToken(client, scopes);
  console.log('OAUTH_TOKEN_OK');
  const result = await runFunction(deploymentId, accessToken, 'inspectBible4ExecutionSystem', true);
  console.log('REMOTE_RUN_OK=inspectBible4ExecutionSystem');
  console.log(JSON.stringify(result, null, 2));
  console.log('BIBLE4_EXECUTION_BRIDGE_VERIFIED');
}

main().catch(err => {
  console.error('BIBLE4_EXECUTION_BRIDGE_FAIL');
  console.error(err?.stack || String(err));
  process.exit(1);
});
