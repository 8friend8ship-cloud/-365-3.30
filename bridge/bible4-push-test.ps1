param(
  [switch]$ForcePush
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$runtime = Join-Path $repoRoot '.bridge-runtime\bible4'
$liveDir = Join-Path $runtime 'live'
$claspFile = Join-Path $runtime '.clasp.json'

if (-not (Test-Path $claspFile)) { throw 'Bible4 브리지가 아직 초기화되지 않았습니다. 먼저 bridge/bible4-clasp-setup.ps1 을 실행하세요.' }
if (-not (Test-Path $liveDir)) { throw 'live 폴더가 없습니다. bootstrap을 다시 실행하세요.' }

Push-Location $runtime
try {
  Write-Host '=== Bible4 Bridge Preflight ==='
  npx --prefix $repoRoot clasp status

  Write-Host ''
  Write-Host '[SAFE MODE] 이 스크립트는 기본값으로 push하지 않습니다.'
  Write-Host '중앙 에이전트가 live 전체파일 병합/문법검사/함수검사를 완료한 뒤 -ForcePush 로 실행합니다.'

  if (-not $ForcePush) {
    Write-Host 'BRIDGE_PREFLIGHT_OK_NO_PUSH'
    exit 0
  }

  Write-Host '[1/3] Apps Script 라이브 전체 push'
  npx --prefix $repoRoot clasp push --force

  Write-Host '[2/3] push 후 상태 확인'
  npx --prefix $repoRoot clasp status

  Write-Host '[3/3] 실행은 중앙 실행 브리지(API executable 또는 승인된 테스트 엔드포인트)에서 수행'
  Write-Host 'PUSH_OK_EXECUTION_BRIDGE_PENDING'
} finally {
  Pop-Location
}
