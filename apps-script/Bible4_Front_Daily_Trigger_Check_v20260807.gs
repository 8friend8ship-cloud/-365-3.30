/*
 * Bible4_Front_Daily_Trigger_Check_v20260807.gs
 *
 * 목적
 * - 프런트앱에 연결되는 4.성경라이브러리/잠언365 계통의 실제 자동 실행 상태를 점검한다.
 * - 코드 존재나 과거 로그만으로 정상 처리하지 않는다.
 * - Content Final -> Audio Final -> App Delivery Final까지 오늘 날짜 결과가 생겨야 성공이다.
 * - PARTIAL/MISSING 및 브라우저 token 노출이 있으면 정상으로 판정하지 않는다.
 * - 기존 다른 트리거는 건드리지 않고 이 모듈의 트리거만 관리한다.
 */

var BIBLE4_DAILY_HANDLER = 'runBible4DailyFrontDelivery_';
var BIBLE4_TRIGGER_STATE_SHEET = 'Bible4_Daily_Trigger_State';
var BIBLE4_TRIGGER_LOG_SHEET = 'Bible4_Daily_Trigger_Log';
var BIBLE4_CONTENT_FINAL_SHEET = '성경365_Content_Final';
var BIBLE4_AUDIO_FINAL_SHEET = '성경365_Audio_Final';
var BIBLE4_APP_DELIVERY_SHEET = '성경365_App_Delivery_Final';

function inspectBible4DailyFrontTrigger() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var props = PropertiesService.getScriptProperties();
  var targetTriggers = ScriptApp.getProjectTriggers()
    .filter(function(t) { return t.getHandlerFunction() === BIBLE4_DAILY_HANDLER; })
    .map(function(t) {
      return {
        handler: t.getHandlerFunction(),
        eventType: String(t.getEventType()),
        source: String(t.getTriggerSource()),
        uniqueId: t.getUniqueId()
      };
    });

  var result = {
    checkedAt: new Date().toISOString(),
    spreadsheetId: ss.getId(),
    targetTriggerCount: targetTriggers.length,
    targetTriggers: targetTriggers,
    configuredHour: props.getProperty('BIBLE4_DAILY_HOUR') || '',
    lastStartedAt: props.getProperty('BIBLE4_LAST_STARTED_AT') || '',
    lastSuccessAt: props.getProperty('BIBLE4_LAST_SUCCESS_AT') || '',
    lastFailedAt: props.getProperty('BIBLE4_LAST_FAILED_AT') || '',
    lastError: props.getProperty('BIBLE4_LAST_ERROR') || '',
    contentFinal: bible4SheetEvidence_(ss, BIBLE4_CONTENT_FINAL_SHEET),
    audioFinal: bible4SheetEvidence_(ss, BIBLE4_AUDIO_FINAL_SHEET),
    appDeliveryFinal: bible4SheetEvidence_(ss, BIBLE4_APP_DELIVERY_SHEET)
  };

  result.status = bible4EvaluateStatus_(result);
  bible4WriteState_(ss, result);
  console.log(JSON.stringify(result, null, 2));
  return result;
}

function runBible4DailyFrontDelivery_() {
  var props = PropertiesService.getScriptProperties();
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) {
    throw new Error('BIBLE4_DAILY_ALREADY_RUNNING');
  }

  props.setProperty('BIBLE4_LAST_STARTED_AT', new Date().toISOString());
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  try {
    bible4RequireFunction_('buildSeries365Daily');
    bible4RequireFunction_('buildProverbs365TitleAudioDaily');
    bible4RequireFunction_('buildProverbs365AudioDelivery');

    buildSeries365Daily();
    buildProverbs365TitleAudioDaily();
    buildProverbs365AudioDelivery();

    var evidence = inspectBible4DailyFrontTrigger();
    if (evidence.status !== 'LIVE_OUTPUT_OK') {
      throw new Error('BIBLE4_OUTPUT_NOT_CURRENT: ' + evidence.status);
    }

    props.setProperty('BIBLE4_LAST_SUCCESS_AT', new Date().toISOString());
    props.deleteProperty('BIBLE4_LAST_ERROR');
    bible4AppendLog_(ss, 'FULL_CHAIN', 'DONE', 'Content→Audio→App Delivery 실제 출력·품질 게이트 확인', evidence);
    return evidence;
  } catch (error) {
    var message = error && error.stack ? error.stack : String(error);
    props.setProperty('BIBLE4_LAST_FAILED_AT', new Date().toISOString());
    props.setProperty('BIBLE4_LAST_ERROR', message.slice(0, 9000));
    bible4AppendLog_(ss, 'FULL_CHAIN', 'ERROR', String(error), { stack: message.slice(0, 9000) });
    throw error;
  } finally {
    lock.releaseLock();
  }
}

/*
 * 설치 시간은 임의로 정하지 않는다.
 * Script Properties에 BIBLE4_DAILY_HOUR=0~23을 먼저 저장한 뒤 실행한다.
 */
function installBible4DailyFrontTrigger() {
  var props = PropertiesService.getScriptProperties();
  var raw = props.getProperty('BIBLE4_DAILY_HOUR');
  if (raw === null || raw === '') {
    throw new Error('BIBLE4_DAILY_HOUR_MISSING');
  }
  var hour = Number(raw);
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    throw new Error('BIBLE4_DAILY_HOUR_INVALID');
  }

  removeBible4DailyFrontTrigger_();
  ScriptApp.newTrigger(BIBLE4_DAILY_HANDLER)
    .timeBased()
    .everyDays(1)
    .atHour(hour)
    .create();

  props.setProperty('BIBLE4_TRIGGER_INSTALLED_AT', new Date().toISOString());
  var result = inspectBible4DailyFrontTrigger();
  if (result.targetTriggerCount !== 1) {
    throw new Error('BIBLE4_TRIGGER_COUNT_NOT_ONE');
  }
  return result;
}

function pauseBible4DailyFrontTrigger() {
  removeBible4DailyFrontTrigger_();
  return inspectBible4DailyFrontTrigger();
}

function removeBible4DailyFrontTrigger_() {
  ScriptApp.getProjectTriggers()
    .filter(function(t) { return t.getHandlerFunction() === BIBLE4_DAILY_HANDLER; })
    .forEach(function(t) { ScriptApp.deleteTrigger(t); });
}

function bible4RequireFunction_(name) {
  var fn = globalThis[name];
  if (typeof fn !== 'function') {
    throw new Error('BIBLE4_ENTRYPOINT_MISSING: ' + name);
  }
}

function bible4SheetEvidence_(ss, sheetName) {
  var sh = ss.getSheetByName(sheetName);
  if (!sh) return {
    sheet: sheetName,
    exists: false,
    lastRow: 0,
    updatedToday: false,
    containsPartial: false,
    containsMissing: false,
    containsBrowserToken: false
  };

  var lastRow = sh.getLastRow();
  var lastColumn = sh.getLastColumn();
  var sample = [];
  if (lastRow >= 2) {
    var start = Math.max(2, lastRow - 4);
    sample = sh.getRange(start, 1, lastRow - start + 1, Math.min(lastColumn, 70)).getDisplayValues();
  }
  var today = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Seoul', 'yyyy-MM-dd');
  var todayRows = sample.filter(function(r) { return r.join(' | ').indexOf(today) !== -1; });
  var todayFlat = todayRows.map(function(r) { return r.join(' | '); }).join('\n');
  var updatedToday = todayRows.length > 0;

  return {
    sheet: sheetName,
    exists: true,
    lastRow: lastRow,
    lastColumn: lastColumn,
    updatedToday: updatedToday,
    containsPartial: updatedToday && todayFlat.indexOf('PARTIAL') !== -1,
    containsMissing: updatedToday && todayFlat.indexOf('MISSING') !== -1,
    containsBrowserToken: updatedToday && todayFlat.indexOf('token=') !== -1
  };
}

function bible4EvaluateStatus_(r) {
  if (r.targetTriggerCount === 0) return 'TRIGGER_MISSING';
  if (r.targetTriggerCount > 1) return 'TRIGGER_DUPLICATED';
  if (!r.contentFinal.exists || !r.audioFinal.exists || !r.appDeliveryFinal.exists) return 'OUTPUT_SHEET_MISSING';
  if (!r.contentFinal.updatedToday) return 'CONTENT_NOT_CURRENT';
  if (!r.audioFinal.updatedToday) return 'AUDIO_NOT_CURRENT';
  if (!r.appDeliveryFinal.updatedToday) return 'APP_DELIVERY_NOT_CURRENT';
  if (r.audioFinal.containsPartial || r.appDeliveryFinal.containsPartial) return 'OUTPUT_PARTIAL';
  if (r.audioFinal.containsMissing || r.appDeliveryFinal.containsMissing) return 'AUDIO_MISSING';
  if (r.appDeliveryFinal.containsBrowserToken) return 'BROWSER_TOKEN_EXPOSED';
  return 'LIVE_OUTPUT_OK';
}

function bible4WriteState_(ss, result) {
  var sh = ss.getSheetByName(BIBLE4_TRIGGER_STATE_SHEET) || ss.insertSheet(BIBLE4_TRIGGER_STATE_SHEET);
  sh.clearContents();
  sh.getRange(1, 1, 1, 3).setValues([['KEY','VALUE','UPDATED_AT']]);
  var now = new Date();
  var rows = [
    ['STATUS', result.status, now],
    ['TARGET_TRIGGER_COUNT', String(result.targetTriggerCount), now],
    ['CONFIGURED_HOUR', String(result.configuredHour || ''), now],
    ['LAST_STARTED_AT', String(result.lastStartedAt || ''), now],
    ['LAST_SUCCESS_AT', String(result.lastSuccessAt || ''), now],
    ['LAST_FAILED_AT', String(result.lastFailedAt || ''), now],
    ['CONTENT_FINAL_TODAY', String(!!result.contentFinal.updatedToday), now],
    ['AUDIO_FINAL_TODAY', String(!!result.audioFinal.updatedToday), now],
    ['APP_DELIVERY_TODAY', String(!!result.appDeliveryFinal.updatedToday), now],
    ['OUTPUT_PARTIAL', String(!!(result.audioFinal.containsPartial || result.appDeliveryFinal.containsPartial)), now],
    ['AUDIO_MISSING', String(!!(result.audioFinal.containsMissing || result.appDeliveryFinal.containsMissing)), now],
    ['BROWSER_TOKEN_EXPOSURE', String(!!result.appDeliveryFinal.containsBrowserToken), now]
  ];
  sh.getRange(2, 1, rows.length, 3).setValues(rows);
}

function bible4AppendLog_(ss, stage, status, message, detail) {
  var sh = ss.getSheetByName(BIBLE4_TRIGGER_LOG_SHEET) || ss.insertSheet(BIBLE4_TRIGGER_LOG_SHEET);
  if (sh.getLastRow() === 0) {
    sh.appendRow(['LOG_AT','DATE','STAGE','STATUS','MESSAGE','DETAIL_JSON']);
  }
  var now = new Date();
  var dateKey = Utilities.formatDate(now, Session.getScriptTimeZone() || 'Asia/Seoul', 'yyyy-MM-dd');
  sh.appendRow([now, dateKey, stage, status, message, JSON.stringify(detail || {})]);
}