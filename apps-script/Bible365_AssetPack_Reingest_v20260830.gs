/* Bible365 canonical asset reingest lane
 * Purpose: reuse existing Drive/Sheet language/audio assets as Queens/Seed packs.
 * Runtime rule: called logically from the existing Bible365/Daily5 wake; do NOT install a second physical timer.
 * Browser secrets are never written here or returned to the front.
 */

const B365_ASSET_REINGEST_VERSION = 'B365_ASSET_REINGEST_V1_20260830';
const B365_ASSET_LOGICAL_BUCKET_HOURS = 2;

function runBible365AssetReingestLogical2h_() {
  const props = PropertiesService.getScriptProperties();
  const now = new Date();
  const bucketMs = B365_ASSET_LOGICAL_BUCKET_HOURS * 60 * 60 * 1000;
  const bucket = String(Math.floor(now.getTime() / bucketMs));
  const key = 'B365_ASSET_REINGEST_BUCKET';
  if (props.getProperty(key) === bucket) {
    return { success: true, skipped: true, reason: 'ALREADY_RAN_THIS_2H_BUCKET', version: B365_ASSET_REINGEST_VERSION };
  }
  const result = runBible365AssetReingestFromExistingDailyWake({ maxTranslationRows: 250, maxAudioRows: 250 });
  if (result && result.success) props.setProperty(key, bucket);
  return result;
}

function runBible365AssetReingestFromExistingDailyWake(options) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return { success: false, status: 'LOCKED' };
  try {
    options = options || {};
    const ss = SpreadsheetApp.getActive();
    const sourceMap = mustSheet_(ss, '성경365_통합_소스맵');
    const queens = mustSheet_(ss, '성경365_자산_Queens_Index');
    const langSeed = mustSheet_(ss, '성경365_언어팩_Seed');
    const voiceSeed = mustSheet_(ss, '성경365_음성팩_Seed');
    const runLog = mustSheet_(ss, '성경365_일일5_Run_Log');

    const sourceRows = sheetObjects_(sourceMap);
    const libraryId = findSourceFileId_(sourceRows, 'SRC_LIBRARY_CANONICAL');
    if (!libraryId) throw new Error('CANONICAL_LIBRARY_ID_MISSING');

    const library = SpreadsheetApp.openById(libraryId);
    const i18n = library.getSheetByName('I18N_Translation_Cache');
    const audio = library.getSheetByName('성경365_Audio_Final');
    if (!i18n || !audio) throw new Error('CANONICAL_LIBRARY_REQUIRED_TABS_MISSING');

    const langResult = syncLanguageSeeds_(i18n, langSeed, Number(options.maxTranslationRows || 250));
    const voiceResult = syncVoiceSeeds_(audio, voiceSeed, Number(options.maxAudioRows || 250));
    upsertQueensSummary_(queens, langResult, voiceResult, libraryId);

    appendRunLog_(runLog, 'ASSET_REINGEST', 'PASS', JSON.stringify({lang: langResult, voice: voiceResult, libraryId: libraryId, version: B365_ASSET_REINGEST_VERSION}));
    return { success: true, version: B365_ASSET_REINGEST_VERSION, libraryId: libraryId, lang: langResult, voice: voiceResult };
  } catch (err) {
    try { appendRunLog_(SpreadsheetApp.getActive().getSheetByName('성경365_일일5_Run_Log'), 'ASSET_REINGEST', 'ERROR', String(err && err.message || err)); } catch (_) {}
    return { success: false, version: B365_ASSET_REINGEST_VERSION, error: String(err && err.message || err) };
  } finally {
    lock.releaseLock();
  }
}

function b365AssetPackHealth() {
  const ss = SpreadsheetApp.getActive();
  const required = ['성경365_통합_소스맵','성경365_자산_Queens_Index','성경365_언어팩_Seed','성경365_음성팩_Seed','성경365_템플릿_Registry','성경365_MVP_QA'];
  const missing = required.filter(n => !ss.getSheetByName(n));
  const sourceRows = ss.getSheetByName('성경365_통합_소스맵') ? sheetObjects_(ss.getSheetByName('성경365_통합_소스맵')) : [];
  const canonicalLibraryId = findSourceFileId_(sourceRows, 'SRC_LIBRARY_CANONICAL');
  return { success: missing.length === 0 && !!canonicalLibraryId, version: B365_ASSET_REINGEST_VERSION, missing: missing, canonicalLibraryId: canonicalLibraryId || '', physicalTriggerCreated: false };
}

function syncLanguageSeeds_(src, dst, maxRows) {
  const values = src.getDataRange().getValues();
  if (values.length < 2) return { scanned: 0, upserted: 0 };
  const h = indexHeader_(values[0]);
  const langs = [['ko-KR','KO'],['en-US','EN'],['ja-JP','JA'],['zh-CN','ZH'],['es-ES','ES'],['de-DE','DE'],['hi-IN','HI']];
  const existing = rowKeyIndex_(dst, 0);
  let scanned = 0, upserted = 0;
  const limit = Math.min(values.length - 1, Math.max(1, maxRows));
  for (let i = 1; i <= limit; i++) {
    const r = values[i];
    const cacheKey = String(r[h.CACHE_KEY] || '').trim();
    const sourceText = String(r[h.SOURCE_TEXT] || '').trim();
    if (!cacheKey || !sourceText) continue;
    scanned++;
    langs.forEach(pair => {
      const locale = pair[0], col = pair[1];
      const text = String(r[h[col]] || '').trim();
      if (!text) return;
      const id = 'LANGROW_' + cacheKey + '_' + locale;
      const qa = locale === 'ja-JP' ? 'QUARANTINE_QA_REQUIRED' : (locale === 'zh-CN' ? 'QA_REQUIRED' : 'REUSE_WITH_QA');
      const row = [id, locale, 'I18N_Translation_Cache:' + cacheKey, 'LEGACY_SOURCE_POINTER_ONLY', 'SOURCE_TEXT→LOCALIZED_TEXT', qa, 'LOCAL_PACK_AFTER_QA', 'KO', 'QUALIFIED_SEED_ROW', new Date()];
      upsertRow_(dst, existing, id, row);
      upserted++;
    });
  }
  return { scanned: scanned, upserted: upserted, maxRows: limit };
}

function syncVoiceSeeds_(src, dst, maxRows) {
  const values = src.getDataRange().getValues();
  if (values.length < 2) return { scanned: 0, upserted: 0 };
  const h = indexHeader_(values[0]);
  const langs = [['ko-KR','KO'],['en-US','EN'],['ja-JP','JP'],['zh-CN','CN'],['es-ES','ES'],['de-DE','DE'],['hi-IN','HI']];
  const existing = rowKeyIndex_(dst, 0);
  let scanned = 0, upserted = 0;
  const limit = Math.min(values.length - 1, Math.max(1, maxRows));
  for (let i = 1; i <= limit; i++) {
    const r = values[i];
    const contentKey = String(r[h.CONTENT_KEY] || '').trim();
    if (!contentKey) continue;
    scanned++;
    langs.forEach(pair => {
      const locale = pair[0], sfx = pair[1];
      const fileId = String(r[h['AUDIO_FILE_ID_' + sfx]] || '').trim();
      const status = String(r[h['STATUS_' + sfx]] || '').trim();
      if (!fileId && status !== 'READY') return;
      const id = 'VOICEROW_' + contentKey + '_' + locale;
      const qa = locale === 'ja-JP' ? 'TEXT_QA_REQUIRED_BEFORE_PLAYBACK' : 'FILE_POINTER_QA';
      const row = [id, locale, '성경365_Audio_Final:' + contentKey, 'localized audioText/content-by-lang', fileId ? ('DRIVE_FILE_ID:' + fileId) : 'NO_FILE_ID', qa, 'same-origin/server pointer; saved audio first; device TTS fallback', status === 'READY' ? 'QUALIFIED_FILE_SEED' : 'SEED_PENDING_FILE', new Date()];
      upsertRow_(dst, existing, id, row);
      upserted++;
    });
  }
  return { scanned: scanned, upserted: upserted, maxRows: limit };
}

function upsertQueensSummary_(sheet, langResult, voiceResult, libraryId) {
  const key = 'Q_B365_REINGEST_' + Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Seoul', 'yyyyMMdd');
  const existing = rowKeyIndex_(sheet, 0);
  upsertRow_(sheet, existing, key, [key, 'LIBRARY:' + libraryId, 'CANONICAL_REINGEST', 'I18N scanned=' + langResult.scanned + '; voice scanned=' + voiceResult.scanned, 'KO,EN,JA,ZH,ES,DE,HI', 'POINTER_REUSE', 'QA_GATED', 'Language/Voice Seed', 'B365_LANGUAGE_PACK_V1;B365_VOICE_PACK_V1', 'APP_BIBLE365', 'NO_BROWSER_SECRET', key, 'QUALIFIED_QUEENS_RUNTIME', new Date()]);
}

function appendRunLog_(sheet, stage, status, details) {
  if (!sheet) return;
  const width = Math.max(10, sheet.getLastColumn());
  const row = new Array(width).fill('');
  row[0] = new Date(); row[1] = 'ASSET_REINGEST'; row[2] = B365_ASSET_REINGEST_VERSION; row[3] = stage; row[4] = status; row[5] = details;
  sheet.appendRow(row);
}

function mustSheet_(ss, name) { const s = ss.getSheetByName(name); if (!s) throw new Error('MISSING_SHEET:' + name); return s; }
function indexHeader_(header) { const out = {}; header.forEach((v,i) => out[String(v || '').trim()] = i); return out; }
function sheetObjects_(sheet) { const v = sheet.getDataRange().getValues(); if (v.length < 2) return []; const h = v[0]; return v.slice(1).filter(r => r.some(x => x !== '')).map(r => { const o={}; h.forEach((k,i)=>o[String(k||'').trim()]=r[i]); return o; }); }
function findSourceFileId_(rows, sourceId) { const r = rows.find(x => String(x.SOURCE_ID || '') === sourceId); return r ? String(r.FILE_ID || '') : ''; }
function rowKeyIndex_(sheet, keyCol) { const n = sheet.getLastRow(); const map = {}; if (n < 2) return map; const vals = sheet.getRange(2, keyCol + 1, n - 1, 1).getValues(); vals.forEach((r,i) => { const k=String(r[0]||''); if(k) map[k]=i+2; }); return map; }
function upsertRow_(sheet, index, key, row) { let target = index[key]; if (!target) { target = sheet.getLastRow() + 1; index[key] = target; } sheet.getRange(target, 1, 1, row.length).setValues([row]); }
