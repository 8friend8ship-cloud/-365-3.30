$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$runtime = Join-Path $repoRoot '.bridge-runtime\bible4'
$liveDir = Join-Path $runtime 'live'
$liveCode = Join-Path $liveDir 'Code.js'
$fallback = Join-Path $repoRoot 'apps-script\Bible4_V12_Auto_E2E_Fallback_20260810.gs'
$backupDir = Join-Path $runtime 'backups'

Write-Host '=== Bible4 V12 Candidate Prepare ==='

if (-not (Test-Path $liveCode)) { throw 'LIVE_CODE_MISSING: bootstrap pull을 먼저 실행하세요.' }
if (-not (Test-Path $fallback)) { throw 'V12_FALLBACK_MODULE_MISSING' }
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

$code = Get-Content -LiteralPath $liveCode -Raw -Encoding UTF8
$fallbackCode = Get-Content -LiteralPath $fallback -Raw -Encoding UTF8

$required = @(
  'runBible4DailyFrontDelivery_',
  'buildProverbs365TitleAudioDaily',
  'buildProverbs365AudioDelivery',
  'b4DailyTriggerSheetNames_',
  'b4FindTodayRows_',
  'getProverbsAudioSheetHeaders_',
  'getProverbsDeliverySheetHeaders_',
  'upsertRowByKey_'
)
$missing = @()
foreach ($name in $required) {
  if ($code -notmatch [regex]::Escape($name)) { $missing += $name }
}
if ($missing.Count -gt 0) { throw ('REQUIRED_FUNCTIONS_MISSING: ' + ($missing -join ', ')) }

# 실제 키/토큰이 코드에 하드코딩되어 있으면 push 후보 생성을 차단한다.
$secretPatterns = @(
  'AIza[0-9A-Za-z_\-]{20,}',
  'sk-[A-Za-z0-9_\-]{20,}',
  '(?i)(access[_-]?token|refresh[_-]?token|api[_-]?key)\s*[:=]\s*["''][A-Za-z0-9_\-\.]{20,}["'']'
)
foreach ($pattern in $secretPatterns) {
  if ([regex]::IsMatch($code, $pattern)) { throw ('SECRET_LITERAL_DETECTED_BLOCK_PUSH: pattern=' + $pattern) }
}

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backup = Join-Path $backupDir ("Code.js.before-v12-$stamp.bak")
Copy-Item -LiteralPath $liveCode -Destination $backup -Force
Write-Host ("BACKUP_OK=" + $backup)

if ($code -notmatch 'b4EnsureTodayFrontLocalAudioMarker_') {
  $code = $code.TrimEnd() + "`r`n`r`n" + $fallbackCode.Trim() + "`r`n"
  Write-Host 'V12_MODULE_APPENDED'
} else {
  Write-Host 'V12_MODULE_ALREADY_PRESENT'
}

# Daily runner의 기존 Audio/Delivery 호출 뒤에 fallback을 삽입한다.
$audioFallback = "`$0`r`n  if (b4CountTodayRows_(b4DailyTriggerSheetNames_().audio, today) < 1) b4EnsureTodayFrontLocalAudioMarker_(today);"
$deliveryFallback = "`$0`r`n  if (b4CountTodayRows_(b4DailyTriggerSheetNames_().delivery, today) < 1) b4EnsureTodayFrontLocalDelivery_(today);"

if ($code -notmatch 'b4EnsureTodayFrontLocalAudioMarker_\(today\);') {
  $patternAudio = 'buildProverbs365TitleAudioDaily\s*\(\s*\{[^;]*onlyDateKey\s*:\s*today[^;]*\}\s*\)\s*;'
  if (-not [regex]::IsMatch($code, $patternAudio, [System.Text.RegularExpressions.RegexOptions]::Singleline)) {
    throw 'AUDIO_INSERT_POINT_NOT_FOUND'
  }
  $code = [regex]::Replace($code, $patternAudio, $audioFallback, 1, [System.TimeSpan]::FromSeconds(2))
  Write-Host 'AUDIO_FALLBACK_INJECTED'
}

if ($code -notmatch 'b4EnsureTodayFrontLocalDelivery_\(today\);') {
  $patternDelivery = 'buildProverbs365AudioDelivery\s*\(\s*\)\s*;'
  if (-not [regex]::IsMatch($code, $patternDelivery)) { throw 'DELIVERY_INSERT_POINT_NOT_FOUND' }
  $code = [regex]::Replace($code, $patternDelivery, $deliveryFallback, 1)
  Write-Host 'DELIVERY_FALLBACK_INJECTED'
}

Set-Content -LiteralPath $liveCode -Value $code -Encoding UTF8

# Syntax check
& node --check $liveCode
if ($LASTEXITCODE -ne 0) {
  Copy-Item -LiteralPath $backup -Destination $liveCode -Force
  throw 'NODE_SYNTAX_CHECK_FAILED_ROLLED_BACK'
}
Write-Host 'SYNTAX_OK'

# 중복 삽입/필수 함수 확인
$checks = @(
  'b4EnsureTodayFrontLocalAudioMarker_',
  'b4EnsureTodayFrontLocalDelivery_',
  'runBible4DailyFrontDelivery_'
)
foreach ($name in $checks) {
  if (([regex]::Matches($code, [regex]::Escape($name))).Count -lt 1) { throw ('POST_MERGE_CHECK_FAIL: ' + $name) }
}

Push-Location $runtime
try {
  npx --prefix $repoRoot clasp status
} finally {
  Pop-Location
}

Write-Host 'V12_CANDIDATE_READY_NO_PUSH'
Write-Host ('candidate=' + $liveCode)
Write-Host ('backup=' + $backup)
