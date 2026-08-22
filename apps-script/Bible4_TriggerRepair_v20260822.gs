var BIBLE4_TRIGGER_REPAIR_VERSION = 'BIBLE4_TRIGGER_REPAIR_V1_20260822';

/**
 * Safe installer: preserve the first healthy target trigger, remove only
 * duplicates, and create a trigger only when it is missing.
 */
function installOrRepairBible4DailyFrontTrigger() {
  var props = PropertiesService.getScriptProperties();
  var raw = props.getProperty('BIBLE4_DAILY_HOUR');
  if (raw === null || raw === '') throw new Error('BIBLE4_DAILY_HOUR_MISSING');
  var hour = Number(raw);
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) throw new Error('BIBLE4_DAILY_HOUR_INVALID');

  var own = ScriptApp.getProjectTriggers().filter(function(t){
    return t.getHandlerFunction() === BIBLE4_DAILY_HANDLER;
  });
  own.slice(1).forEach(function(t){ ScriptApp.deleteTrigger(t); });
  var created = false;
  if (own.length === 0) {
    ScriptApp.newTrigger(BIBLE4_DAILY_HANDLER).timeBased().everyDays(1).atHour(hour).create();
    created = true;
  }
  props.setProperty('BIBLE4_TRIGGER_REPAIR_AT', new Date().toISOString());
  var audit = inspectBible4DailyFrontTrigger();
  if (audit.targetTriggerCount !== 1) throw new Error('BIBLE4_TRIGGER_COUNT_NOT_ONE');
  return {ok:true, created:created, duplicatesRemoved:Math.max(0,own.length-1), audit:audit, version:BIBLE4_TRIGGER_REPAIR_VERSION};
}

function testBible4DailyFrontDeliveryX2() {
  if (typeof runBible4DailyFrontDelivery_ !== 'function') return {ok:false, reason:'BIBLE4_HANDLER_NOT_SYNCED'};
  var r1;
  var r2;
  try { r1 = runBible4DailyFrontDelivery_(); }
  catch (e1) { r1 = {ok:false,error:String(e1 && e1.message || e1)}; }
  Utilities.sleep(50);
  try { r2 = runBible4DailyFrontDelivery_(); }
  catch (e2) { r2 = {ok:false,error:String(e2 && e2.message || e2)}; }
  var pass = r1 && r1.status === 'LIVE_OUTPUT_OK' && r2 && r2.status === 'LIVE_OUTPUT_OK';
  return {ok:pass, API_FREE_FINAL_PASS:pass, run1:r1, run2:r2, version:BIBLE4_TRIGGER_REPAIR_VERSION};
}
