/**
 * Bible1 Unified Delivery Gateway
 * Canonical target: 1.잠언 365: AI 지혜의 등불
 * Purpose: collapse legacy Bible2/Bible3 translation, TTS/audio and front-delivery
 * routing behind one Bible1 contract. This module does not install triggers or deploy.
 *
 * Required integration rule:
 * - Existing canonical Bible1 doGet(e) delegates GET_CONTENT to handleBible1UnifiedGet_(e)
 * - Existing writer/translation/audio producers persist into canonical package fields.
 * - Legacy Bible2/Bible3 projects are migration sources only; no new triggers.
 */

var BIBLE1_UNIFIED = Object.freeze({
  CONTRACT: 'BIBLE1_UNIFIED_DELIVERY_V1',
  APP_ID: 'APP_BIBLE365',
  CANONICAL_SPREADSHEET_ID: '1HK4ATRZ-lSZ4fyuZi4ypHodgGZK1kBMsEFkAxOm9904',
  PUBLIC_SHEET: 'Public_Output'
});

function handleBible1UnifiedGet_(e) {
  var p = (e && e.parameter) || {};
  var action = String(p.action || 'GET_CONTENT').toUpperCase();
  if (action !== 'GET_CONTENT') {
    return bible1Json_({ success: false, contract: BIBLE1_UNIFIED.CONTRACT, error: 'UNSUPPORTED_ACTION' });
  }

  var type = String(p.type || 'latest').toLowerCase();
  var dayKey = String(p.dayKey || '');
  var packageResult = buildBible1UnifiedDeliveryPackage_(type, dayKey);
  return bible1Json_(packageResult);
}

function buildBible1UnifiedDeliveryPackage_(type, dayKey) {
  var ss = SpreadsheetApp.openById(BIBLE1_UNIFIED.CANONICAL_SPREADSHEET_ID);
  var sheet = ss.getSheetByName(BIBLE1_UNIFIED.PUBLIC_SHEET);
  if (!sheet) throw new Error('Missing canonical sheet: ' + BIBLE1_UNIFIED.PUBLIC_SHEET);

  var values = sheet.getDataRange().getValues();
  if (values.length < 2) {
    return { success: true, contract: BIBLE1_UNIFIED.CONTRACT, appId: BIBLE1_UNIFIED.APP_ID, items: [], updatedAt: new Date().toISOString() };
  }

  var headers = values[0].map(function(v) { return String(v || '').trim(); });
  var rows = values.slice(1).map(function(row) { return bible1RowObject_(headers, row); });
  rows = rows.filter(function(row) { return bible1IsFrontReady_(row); });

  if (type === 'day' && dayKey) {
    rows = rows.filter(function(row) { return String(row.DAY_KEY || row.dayKey || '') === dayKey; });
  } else if (type === 'today') {
    var today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    rows = rows.filter(function(row) { return String(row.DAY_KEY || row.dayKey || row.DATE || '') === today; });
  } else {
    rows.sort(function(a, b) {
      return String(b.UPDATED_AT || b.CREATED_AT || '').localeCompare(String(a.UPDATED_AT || a.CREATED_AT || ''));
    });
    rows = rows.slice(0, 30);
  }

  return {
    success: true,
    contract: BIBLE1_UNIFIED.CONTRACT,
    appId: BIBLE1_UNIFIED.APP_ID,
    dayKey: dayKey || undefined,
    items: rows.map(bible1NormalizeFrontItem_),
    updatedAt: new Date().toISOString(),
    meta: {
      canonicalSpreadsheetId: BIBLE1_UNIFIED.CANONICAL_SPREADSHEET_ID,
      translationSource: 'BIBLE1_CANONICAL_PACKAGE',
      audioSource: 'BIBLE1_CANONICAL_PACKAGE',
      legacyBible2Bible3DirectRouting: false
    }
  };
}

function bible1NormalizeFrontItem_(row) {
  return {
    slot: Number(row.SLOT || row.slot || 0),
    id: String(row.CONTENT_ID || row.ID || row.id || ''),
    situation: String(row.SITUATION || row.situation || ''),
    dry: bible1SafeJson_(row.DRY_JSON || row.dry, { title: String(row.TITLE || ''), body: String(row.BODY || '') }),
    devotion: bible1SafeJson_(row.DEVOTION_JSON || row.devotion, { title: String(row.DEVOTION_TITLE || ''), body: String(row.DEVOTION_BODY || '') }),
    merged: String(row.MERGED || row.merged || row.BODY || ''),
    translations: bible1SafeJson_(row.TRANSLATIONS_JSON || row.translations, {}),
    situation_i18n: bible1SafeJson_(row.SITUATION_I18N_JSON || row.situation_i18n, {}),
    bible_i18n: bible1SafeJson_(row.BIBLE_I18N_JSON || row.bible_i18n, {}),
    audio: bible1SafeJson_(row.AUDIO_JSON || row.audio, {}),
    audio_direct: bible1SafeJson_(row.AUDIO_DIRECT_JSON || row.audio_direct, {}),
    audioFileIds: bible1SafeJson_(row.AUDIO_FILE_IDS_JSON || row.audioFileIds, {}),
    tags: bible1SafeJson_(row.TAGS_JSON || row.tags, []),
    status: String(row.STATUS || row.status || ''),
    bible: {
      ref: String(row.BIBLE_REF || row.reference || ''),
      text: String(row.BIBLE_TEXT || row.verse || '')
    },
    createdAt: String(row.CREATED_AT || row.createdAt || '')
  };
}

function bible1IsFrontReady_(row) {
  var active = String(row.ACTIVE_YN == null ? 'Y' : row.ACTIVE_YN).toUpperCase() !== 'N';
  var approved = String(row.APPROVED_YN == null ? 'Y' : row.APPROVED_YN).toUpperCase() !== 'N';
  var publicYn = String(row.PUBLIC_YN == null ? 'Y' : row.PUBLIC_YN).toUpperCase() !== 'N';
  return active && approved && publicYn;
}

function bible1RowObject_(headers, row) {
  var out = {};
  headers.forEach(function(h, i) { if (h) out[h] = row[i]; });
  return out;
}

function bible1SafeJson_(value, fallback) {
  if (value == null || value === '') return fallback;
  if (typeof value === 'object') return value;
  try { return JSON.parse(String(value)); } catch (_) { return fallback; }
}

function bible1Json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
