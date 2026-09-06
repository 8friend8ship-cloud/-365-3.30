/**
 * Canonical Bible365 T2 package adapter for the existing Bible1 spreadsheet.
 * It reads approved output and returns a front/platform package. It does not
 * create triggers, deploy, publish, or modify legacy Bible2/Bible3 sources.
 */
var BIBLE365_T2_PACK_VERSION = 'BIBLE365_T2_PACK_V1_20260821';
var BIBLE365_T2_CANONICAL_SHEET = '03_Public_Output';

function buildBible365T2Delivery() {
  var ss = SpreadsheetApp.openById('1HK4ATRZ-lSZ4fyuZi4ypHodgGZK1kBMsEFkAxOm9904');
  var sh = ss.getSheetByName(BIBLE365_T2_CANONICAL_SHEET);
  if (!sh) throw new Error('BIBLE365_CANONICAL_OUTPUT_SHEET_MISSING:' + BIBLE365_T2_CANONICAL_SHEET);
  var values = sh.getDataRange().getValues();
  if (values.length < 2) return { ok: true, version: BIBLE365_T2_PACK_VERSION, count: 0, items: [] };
  var headers = values[0].map(function(v) { return String(v || '').trim(); });
  var items = [];
  for (var i = 1; i < values.length; i++) {
    var row = {};
    for (var c = 0; c < headers.length; c++) if (headers[c]) row[headers[c]] = values[i][c];
    if (!bible365T2FrontReady_(row)) continue;
    items.push(bible365T2Normalize_(row));
  }
  return {
    ok: true,
    contract: 'BIBLE1_UNIFIED_DELIVERY_V1',
    t2Contract: 'BIBLE365_FRONT_PLATFORM_PACK_V2',
    version: BIBLE365_T2_PACK_VERSION,
    appId: 'APP_BIBLE365',
    count: items.length,
    items: items,
    publish: { status: 'WAITING_APPROVAL' },
    at: new Date().toISOString()
  };
}

function bible365T2Normalize_(row) {
  var contentKey = String(row.CONTENT_ID || row.CONTENT_CODE || row.PUBLIC_OUTPUT_ID || '');
  var rights = String(row.RIGHTS_STATUS || 'UNVERIFIED');
  return {
    contentKey: contentKey,
    seedLineage: {
      queensSourceId: String(row.SOURCE_DB_MAP_ID || ''),
      coreId: String(row.CORE_ID || ''),
      publicOutputId: String(row.PUBLIC_OUTPUT_ID || '')
    },
    verse: { ref: String(row.BIBLE_REF || ''), text: String(row.BIBLE_TEXT || '') },
    body: { title: String(row.TITLE || ''), summary: String(row.SUMMARY || '') },
    questionByLang: {
      KO: '오늘 이 말씀 앞에서 내가 솔직히 점검할 한 가지는 무엇인가?'
    },
    actionByLang: {
      KO: '본문을 천천히 한 번 읽고, 오늘 실천할 한 문장을 기록한다.'
    },
    translations: {
      ready: String(row.TRANSLATION_READY_YN || 'N'),
      manifestFileId: String(row.TRANSLATION_MANIFEST_FILE_ID || ''),
      manifestUrl: String(row.TRANSLATION_MANIFEST_URL || '')
    },
    audio: {
      ready: String(row.AUDIO_READY_YN || 'N'),
      manifestFileId: String(row.AUDIO_MANIFEST_FILE_ID || ''),
      manifestUrl: String(row.AUDIO_MANIFEST_URL || ''),
      deliveryExecUrl: String(row.AUDIO_DELIVERY_EXEC_URL || '')
    },
    rights: {
      status: rights,
      publicAudioAllowed: rights === 'VERIFIED' && String(row.AUDIO_READY_YN || 'N') === 'Y'
    },
    platform: {
      frontVisibleDate: String(row.FRONT_VISIBLE_DATE || ''),
      slot: Number(row.DELIVERY_SLOT || 0),
      packageReady: String(row.PACKAGE_READY_YN || 'N'),
      appReady: String(row.APP_READY_YN || 'N'),
      status: String(row.STATUS || '')
    }
  };
}

function bible365T2FrontReady_(row) {
  return String(row.CONTENT_READY_YN || 'N') === 'Y' &&
    String(row.APP_READY_YN || 'N') === 'Y' &&
    String(row.FRONT_EXPOSED_YN || 'N') === 'Y';
}

function inspectBible365T2TemplatePack() {
  var result = buildBible365T2Delivery();
  var errors = [];
  for (var i = 0; i < result.items.length; i++) {
    var item = result.items[i];
    if (!item.contentKey) errors.push('CONTENT_KEY_MISSING:' + i);
    if (!item.verse.ref || !item.verse.text) errors.push('VERSE_MISSING:' + item.contentKey);
    if (!item.body.title || !item.body.summary) errors.push('BODY_MISSING:' + item.contentKey);
    if (!item.questionByLang.KO || !item.actionByLang.KO) errors.push('QUESTION_ACTION_MISSING:' + item.contentKey);
    if (!item.rights.status) errors.push('RIGHTS_STATUS_MISSING:' + item.contentKey);
  }
  return { ok: errors.length === 0, version: BIBLE365_T2_PACK_VERSION, count: result.count, errors: errors, publishStatus: result.publish.status };
}

