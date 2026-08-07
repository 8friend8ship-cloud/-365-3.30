/**
 * Bible365 R16 runtime recovery package.
 *
 * IMPORTANT:
 * 1) Copy this file into the bound Apps Script project of the main Bible365 sheet.
 * 2) Replace the existing saveJsonFile_ body so it delegates to
 *    r16SaveJsonFileSafe_(). Do not leave two saveJsonFile_ functions.
 * 3) Run testR16JsonSave_() once.
 * 4) Only after the test passes, run one READY item manually.
 * 5) Only after the full manual E2E passes, run installR16AutomationTrigger().
 */

const R16_AUTOMATION_HANDLER = 'runR16Scheduled_';
const R16_AUTOMATION_MINUTES = 15;
const R16_JSON_MIME_TYPE = 'application/json';

/**
 * Safe JSON save implementation that never passes a null MIME type.
 * Accepts either a Drive Folder object or a folder ID.
 */
function r16SaveJsonFileSafe_(folderOrId, fileName, payload) {
  const folder = typeof folderOrId === 'string'
    ? DriveApp.getFolderById(folderOrId)
    : folderOrId;

  if (!folder || typeof folder.createFile !== 'function') {
    throw new Error('R16_JSON_SAVE_INVALID_FOLDER');
  }

  const baseName = String(fileName || 'r16-output.json').trim() || 'r16-output.json';
  const safeName = /\.json$/i.test(baseName) ? baseName : `${baseName}.json`;

  let jsonText;
  if (typeof payload === 'string') {
    jsonText = payload;
  } else {
    try {
      jsonText = JSON.stringify(payload, null, 2);
    } catch (error) {
      throw new Error(`R16_JSON_SERIALIZE_FAILED: ${error && error.message ? error.message : error}`);
    }
  }

  if (!jsonText) {
    throw new Error('R16_JSON_SAVE_EMPTY_PAYLOAD');
  }

  // Apps Script's general MimeType enum does not provide a JSON member.
  // Utilities.newBlob accepts an explicit MIME type string, so use the
  // standards-based application/json value instead of a nullable/invalid enum.
  const blob = Utilities.newBlob(String(jsonText), R16_JSON_MIME_TYPE, safeName);
  const file = folder.createFile(blob);

  if (!file || !file.getId()) {
    throw new Error('R16_JSON_SAVE_FAILED');
  }
  if (file.getMimeType() !== R16_JSON_MIME_TYPE) {
    throw new Error(`R16_JSON_MIME_VERIFY_FAILED: ${file.getMimeType()}`);
  }
  if (!(file.getSize() > 0)) {
    throw new Error('R16_JSON_SIZE_VERIFY_FAILED');
  }

  return file;
}

/**
 * Drop-in replacement BODY for the existing saveJsonFile_ function:
 *
 *   return r16SaveJsonFileSafe_(folderOrId, fileName, payload);
 *
 * Keep the old function's parameter names/signature if other code calls it.
 */

/**
 * Scheduled wrapper. It prevents overlapping runs and preserves the existing
 * runR16WriterPipeline() entry point.
 */
function runR16Scheduled_() {
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty('R16_AUTOMATION_ENABLED') !== 'true') {
    console.log('R16_AUTOMATION_SKIPPED: disabled');
    return;
  }

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(3000)) {
    console.log('R16_AUTOMATION_SKIPPED: another run is active');
    return;
  }

  try {
    if (typeof runR16WriterPipeline !== 'function') {
      throw new Error('R16_ENTRYPOINT_MISSING: runR16WriterPipeline');
    }

    props.setProperty('R16_LAST_STARTED_AT', new Date().toISOString());
    runR16WriterPipeline();
    props.setProperty('R16_LAST_SUCCESS_AT', new Date().toISOString());
    props.deleteProperty('R16_LAST_ERROR');
  } catch (error) {
    const message = error && error.stack ? error.stack : String(error);
    props.setProperty('R16_LAST_ERROR', message.slice(0, 9000));
    props.setProperty('R16_LAST_FAILED_AT', new Date().toISOString());
    console.error(message);
    throw error;
  } finally {
    lock.releaseLock();
  }
}

/** Installs one idempotent 15-minute trigger for R16. */
function installR16AutomationTrigger() {
  removeR16AutomationTriggers_();

  ScriptApp.newTrigger(R16_AUTOMATION_HANDLER)
    .timeBased()
    .everyMinutes(R16_AUTOMATION_MINUTES)
    .create();

  const props = PropertiesService.getScriptProperties();
  props.setProperty('R16_AUTOMATION_ENABLED', 'true');
  props.setProperty('R16_TRIGGER_INSTALLED_AT', new Date().toISOString());

  return inspectR16Automation();
}

/** Pauses R16 automation and removes only its own triggers. */
function pauseR16Automation() {
  PropertiesService.getScriptProperties()
    .setProperty('R16_AUTOMATION_ENABLED', 'false');
  removeR16AutomationTriggers_();
  return inspectR16Automation();
}

function removeR16AutomationTriggers_() {
  ScriptApp.getProjectTriggers()
    .filter(trigger => trigger.getHandlerFunction() === R16_AUTOMATION_HANDLER)
    .forEach(trigger => ScriptApp.deleteTrigger(trigger));
}

/** Returns verifiable trigger and last-run evidence. */
function inspectR16Automation() {
  const props = PropertiesService.getScriptProperties();
  const triggers = ScriptApp.getProjectTriggers()
    .filter(trigger => trigger.getHandlerFunction() === R16_AUTOMATION_HANDLER)
    .map(trigger => ({
      handler: trigger.getHandlerFunction(),
      eventType: String(trigger.getEventType()),
      source: String(trigger.getTriggerSource()),
      uniqueId: trigger.getUniqueId(),
    }));

  const result = {
    enabled: props.getProperty('R16_AUTOMATION_ENABLED') === 'true',
    triggerCount: triggers.length,
    triggers,
    lastStartedAt: props.getProperty('R16_LAST_STARTED_AT') || '',
    lastSuccessAt: props.getProperty('R16_LAST_SUCCESS_AT') || '',
    lastFailedAt: props.getProperty('R16_LAST_FAILED_AT') || '',
    lastError: props.getProperty('R16_LAST_ERROR') || '',
  };

  console.log(JSON.stringify(result, null, 2));
  return result;
}

/**
 * Verifies Drive JSON creation independently from Gemini and the full pipeline.
 * Set R16_OUTPUT_FOLDER_ID in Script Properties before running.
 */
function testR16JsonSave_() {
  const props = PropertiesService.getScriptProperties();
  const folderId = props.getProperty('R16_OUTPUT_FOLDER_ID');
  if (!folderId) {
    throw new Error('R16_OUTPUT_FOLDER_ID is missing in Script Properties');
  }

  const file = r16SaveJsonFileSafe_(folderId, 'r16-runtime-test.json', {
    ok: true,
    testedAt: new Date().toISOString(),
    source: 'R16_Runtime_Repair.gs',
  });

  const result = {
    ok: true,
    fileId: file.getId(),
    fileName: file.getName(),
    mimeType: file.getMimeType(),
    size: file.getSize(),
    url: file.getUrl(),
  };

  if (result.mimeType !== R16_JSON_MIME_TYPE || !(result.size > 0)) {
    throw new Error(`R16_JSON_SAVE_TEST_FAILED: ${JSON.stringify(result)}`);
  }

  console.log(JSON.stringify(result, null, 2));
  return result;
}
