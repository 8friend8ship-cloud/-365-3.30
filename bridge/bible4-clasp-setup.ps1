param(
  [string]$ScriptId = $env:BIBLE4_SCRIPT_ID
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$runtime = Join-Path $repoRoot '.bridge-runtime\bible4'
$liveDir = Join-Path $runtime 'live'

Write-Host '=== Bible4 Apps Script Bridge Bootstrap ==='

if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Node.js가 없습니다. Node.js 20+ 설치 후 다시 실행하세요.' }
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { throw 'npm을 찾을 수 없습니다.' }

Push-Location $repoRoot
try {
  if (-not (Test-Path (Join-Path $repoRoot 'node_modules\@google\clasp'))) {
    Write-Host '[1/5] @google/clasp 로컬 설치'
    npm install --save-dev @google/clasp
  }

  Write-Host '[2/5] Google 계정 최초 인증'
  Write-Host '브라우저가 열리면 운영 계정으로 승인하세요. 이미 인증되어 있으면 그대로 통과합니다.'
  npx clasp login

  if (-not $ScriptId) {
    $ScriptId = Read-Host 'Bible4 Apps Script > 프로젝트 설정 > 스크립트 ID 를 붙여넣으세요'
  }
  if (-not $ScriptId) { throw 'Script ID가 비어 있습니다.' }

  Write-Host '[3/5] 로컬 런타임 생성 (Git에 커밋하지 않음)'
  New-Item -ItemType Directory -Force -Path $liveDir | Out-Null
  $claspConfig = @{ scriptId = $ScriptId; rootDir = './live' } | ConvertTo-Json
  Set-Content -Path (Join-Path $runtime '.clasp.json') -Value $claspConfig -Encoding UTF8

  Push-Location $runtime
  try {
    Write-Host '[4/5] 라이브 Apps Script 전체 pull'
    npx --prefix $repoRoot clasp pull
    Write-Host '[5/5] 연결 상태 확인'
    npx --prefix $repoRoot clasp status
  } finally { Pop-Location }

  $state = [ordered]@{
    project = 'BIBLE4'
    connected = $true
    scriptIdPresent = $true
    runtimePath = $runtime
    livePath = $liveDir
    productionDeployApprovalRequired = $true
    updatedAt = (Get-Date).ToString('s')
  } | ConvertTo-Json
  Set-Content -Path (Join-Path $runtime 'bridge-state.json') -Value $state -Encoding UTF8

  Write-Host ''
  Write-Host 'BRIDGE_BOOTSTRAP_OK'
  Write-Host "runtime=$runtime"
  Write-Host "live=$liveDir"
  Write-Host '다음 단계: 중앙 에이전트가 라이브 전체코드와 GitHub 수정본을 병합한 뒤 push/test 합니다.'
} finally {
  Pop-Location
}
