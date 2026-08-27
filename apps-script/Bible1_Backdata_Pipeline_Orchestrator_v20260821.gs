// Bible1_Backdata_Pipeline_Orchestrator_v20260821.gs
// Canonical Bible365 orchestration layer.
// Safety: this module never publishes Blogger posts and never creates a trigger automatically.

var BIBLE365_BACKDATA_PIPELINE_VERSION = '2026-08-21';
var BIBLE365_BACKDATA_TRIGGER_HANDLER = 'runBible365BackdataPipeline';
var BIBLE365_BACKDATA_TIMEZONE = 'Asia/Seoul';
var BIBLE365_BACKDATA_LAST_RUN_KEY = 'BIBLE365_BACKDATA_LAST_RUN';

function bible365BackdataStages_() {
  return [
    {
      stage: 'LIBRARIAN_GATE',
      handler: 'syncBible365LibrarianBackdata',
      required: false,
      note: 'Full Scripture backfill remains optional until provider/version/rights are verified.'
    },
    {
      stage: 'QUEENS_READY',
      external: true,
      dependency: 'TRG_QUEENS_BIBLE',
      required: false,
      note: 'Queens is centrally managed; do not create a parallel Bible1 Queens trigger.'
    },
    {
      stage: 'SEED_BACKFILL',
      handler: 'buildBible365SeedsFromQueens',
      required: false,
      note: 'Backfill only missing/invalid Seed lineage; reuse valid translations/audio.'
    },
    {
      stage: 'T1_DAILY',
      handler: 'buildSeries365Daily',
      required: true
    },
    {
      stage: 'TITLE_AUDIO',
      handler: 'buildProverbs365TitleAudioDaily',
      required: true
    },
    {
      stage: 'DELIVERY_AUDIO',
      handler: 'buildProverbs365AudioDelivery',
      required: true
    },
    {
      stage: 'BLOGGER_DRAFT_GATE',
      handler: 'prepareBible365BloggerDraft',
      required: false,
      note: 'Draft preparation only. Public publishing requires the existing human approval gate.'
    },
    {
      stage: 'T2_DELIVERY',
      handler: 'buildBible365T2Delivery',
      required: false,
      note: 'Package existing T1 + locale/audio/media requirements; do not regenerate T1.'
    }
  ];
}

function bible365ResolveFunction_(name) {
  switch (name) {
    case 'syncBible365LibrarianBackdata':
      return typeof syncBible365LibrarianBackdata === 'function' ? syncBible365LibrarianBackdata : null;
    case 'buildBible365SeedsFromQueens':
      return typeof buildBible365SeedsFromQueens === 'function' ? buildBible365SeedsFromQueens : null;
    case 'buildSeries365Daily':
      return typeof buildSeries365Daily === 'function' ? buildSeries365Daily : null;
    case 'buildProverbs365TitleAudioDaily':
      return typeof buildProverbs365TitleAudioDaily === 'function' ? buildProverbs365TitleAudioDaily : null;
    case 'buildProverbs365AudioDelivery':
      return typeof buildProverbs365AudioDelivery === 'function' ? buildProverbs365AudioDelivery : null;
    case 'prepareBible365BloggerDraft':
      return typeof prepareBible365BloggerDraft === 'function' ? prepareBible365BloggerDraft : null;
    case 'buildBible365T2Delivery':
      return typeof buildBible365T2Delivery === 'function' ? buildBible365T2Delivery : null;
    default:
      return null;
  }
}

function bible365BackdataTriggerInfo_() {
  var triggers = ScriptApp.getProjectTriggers();
  var matched = [];
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === BIBLE365_BACKDATA_TRIGGER_HANDLER) {
      matched.push({
        handler: triggers[i].getHandlerFunction(),
        source: String(triggers[i].getTriggerSource()),
        eventType: String(triggers[i].getEventType()),
        uniqueId: triggers[i].getUniqueId ? triggers[i].getUniqueId() : ''
      });
    }
  }
  return {
    count: matched.length,
    unique: matched.length === 1,
    triggers: matched
  };
}

function inspectBible365BackdataPipeline() {
  var stages = bible365BackdataStages_();
  var inspected = [];
  for (var i = 0; i < stages.length; i++) {
    var stage = stages[i];
    if (stage.external) {
      inspected.push({
        stage: stage.stage,
        status: 'EXTERNAL_MANAGED',
        dependency: stage.dependency,
        required: stage.required,
        note: stage.note || ''
      });
      continue;
    }

    var available = !!bible365ResolveFunction_(stage.handler);
    inspected.push({
      stage: stage.stage,
      handler: stage.handler,
      required: stage.required,
      status: available ? 'AVAILABLE' : (stage.required ? 'REQUIRED_FUNCTION_MISSING' : 'OPTIONAL_FUNCTION_UNAVAILABLE'),
      note: stage.note || ''
    });
  }

  return {
    ok: true,
    service: 'BIBLE365_BACKDATA_PIPELINE',
    version: BIBLE365_BACKDATA_PIPELINE_VERSION,
    trigger: bible365BackdataTriggerInfo_(),
    stages: inspected,
    lastRun: getBible365BackdataLastRun(),
    safety: {
      canonicalBackend: 'BIBLE365_MAIN_CANONICAL',
      parallelLegacyTriggersAllowed: false,
      publicBloggerPublishAllowed: false,
      queensDependency: 'TRG_QUEENS_BIBLE'
    }
  };
}

function runBible365BackdataPipelineDryRun() {
  return inspectBible365BackdataPipeline();
}

function runBible365BackdataPipeline() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) {
    return {
      ok: false,
      status: 'SKIPPED_LOCKED',
      service: 'BIBLE365_BACKDATA_PIPELINE',
      version: BIBLE365_BACKDATA_PIPELINE_VERSION,
      at: new Date().toISOString()
    };
  }

  var startedAt = new Date();
  var runId = 'B365_' + Utilities.formatDate(startedAt, BIBLE365_BACKDATA_TIMEZONE, 'yyyyMMdd_HHmmss');
  var results = [];
  var finalStatus = 'PASS';

  try {
    var stages = bible365BackdataStages_();
    for (var i = 0; i < stages.length; i++) {
      var stage = stages[i];

      if (stage.external) {
        results.push({
          stage: stage.stage,
          status: 'EXTERNAL_MANAGED',
          dependency: stage.dependency,
          note: stage.note || ''
        });
        continue;
      }

      var fn = bible365ResolveFunction_(stage.handler);
      if (!fn) {
        var missingStatus = stage.required ? 'BLOCKED_REQUIRED_FUNCTION_MISSING' : 'SKIPPED_UNAVAILABLE';
        results.push({
          stage: stage.stage,
          handler: stage.handler,
          status: missingStatus,
          required: stage.required,
          note: stage.note || ''
        });
        if (stage.required) {
          finalStatus = missingStatus;
          break;
        }
        continue;
      }

      var stageStartedAt = new Date();
      try {
        var stageResult = fn();
        results.push({
          stage: stage.stage,
          handler: stage.handler,
          status: 'PASS',
          startedAt: stageStartedAt.toISOString(),
          finishedAt: new Date().toISOString(),
          result: bible365SafeResult_(stageResult)
        });
      } catch (err) {
        finalStatus = 'ERROR';
        results.push({
          stage: stage.stage,
          handler: stage.handler,
          status: 'ERROR',
          startedAt: stageStartedAt.toISOString(),
          finishedAt: new Date().toISOString(),
          error: err && err.message ? err.message : String(err)
        });
        break;
      }
    }

    var summary = {
      ok: finalStatus === 'PASS',
      runId: runId,
      service: 'BIBLE365_BACKDATA_PIPELINE',
      version: BIBLE365_BACKDATA_PIPELINE_VERSION,
      status: finalStatus,
      startedAt: startedAt.toISOString(),
      finishedAt: new Date().toISOString(),
      stages: results
    };

    bible365StoreLastRun_(summary);
    console.log(JSON.stringify(summary));
    return summary;
  } finally {
    lock.releaseLock();
  }
}

function bible365SafeResult_(value) {
  if (value === undefined) return null;
  try {
    var serialized = JSON.stringify(value);
    if (serialized && serialized.length > 4000) {
      return {
        truncated: true,
        preview: serialized.substring(0, 4000)
      };
    }
    return JSON.parse(serialized);
  } catch (err) {
    return String(value);
  }
}

function bible365StoreLastRun_(summary) {
  PropertiesService.getScriptProperties().setProperty(
    BIBLE365_BACKDATA_LAST_RUN_KEY,
    JSON.stringify(summary)
  );
}

function getBible365BackdataLastRun() {
  var raw = PropertiesService.getScriptProperties().getProperty(BIBLE365_BACKDATA_LAST_RUN_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (err) {
    return {
      status: 'INVALID_STORED_RESULT',
      raw: raw
    };
  }
}

function installBible365BackdataDailyTrigger(hourKst) {
  if (typeof hourKst !== 'number' || hourKst < 0 || hourKst > 23 || Math.floor(hourKst) !== hourKst) {
    throw new Error('hourKst must be an integer from 0 to 23. No default hour is invented.');
  }

  var before = bible365BackdataTriggerInfo_();
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === BIBLE365_BACKDATA_TRIGGER_HANDLER) {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  var trigger = ScriptApp.newTrigger(BIBLE365_BACKDATA_TRIGGER_HANDLER)
    .timeBased()
    .everyDays(1)
    .atHour(hourKst)
    .inTimezone(BIBLE365_BACKDATA_TIMEZONE)
    .create();

  return {
    ok: true,
    status: 'INSTALLED_SINGLE_DAILY_TRIGGER',
    version: BIBLE365_BACKDATA_PIPELINE_VERSION,
    hourKst: hourKst,
    removedExistingCount: before.count,
    triggerUniqueId: trigger.getUniqueId ? trigger.getUniqueId() : '',
    verify: bible365BackdataTriggerInfo_()
  };
}

function uninstallBible365BackdataDailyTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  var removed = 0;
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === BIBLE365_BACKDATA_TRIGGER_HANDLER) {
      ScriptApp.deleteTrigger(triggers[i]);
      removed++;
    }
  }
  return {
    ok: true,
    status: 'UNINSTALLED',
    removed: removed,
    verify: bible365BackdataTriggerInfo_()
  };
}
