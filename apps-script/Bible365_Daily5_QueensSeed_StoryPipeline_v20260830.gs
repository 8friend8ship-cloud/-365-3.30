/*
 * Bible365_Daily5_QueensSeed_StoryPipeline_v20260830.gs
 *
 * 목적
 * - 기존 Bible365의 DAILY_OUTPUT_TARGET=5 의미를 유지하면서 새 규칙으로 일일 5개 글을 만든다.
 * - 흐름: Daily source/Queens -> Seed -> DryWriter Storyboard T1 -> T2 platform pack -> Front Bridge.
 * - 외부 공개발행은 하지 않는다. T2는 Front/YouTube/Blog/Short/Audio용 초안 패키지만 만든다.
 * - 기존 doGet/doPost를 덮어쓰지 않는다. handleBible365Daily5DoGet()를 기존 dispatcher에 연결한다.
 * - 새 유료 API를 사용하지 않는다. 저장된 Bible_Passage_Library/DB_Map_New/기존 Daily_Publish_Queue를 우선한다.
 */

var B365_DAILY5_VERSION = 'B365_DAILY5_V1_20260830';
var B365_DAILY5_TEMPLATE_ID = 'DRYWRITER_BIBLE_DAILY5_STORYBOARD_V1_20260830';
var B365_DAILY5_TARGET = 5;

var B365_DAILY5_SHEETS = {
  QUEENS: '성경365_일일5_Queens',
  SEED: '성경365_일일5_Seed',
  T1: '성경365_일일5_T1_Template',
  T2: '성경365_일일5_T2_Delivery',
  FRONT: '성경365_일일5_Front_Bridge',
  LOG: '성경365_일일5_Run_Log'
};

var B365_DAILY5_PERSONAS = [
  { id: 'PERSONA_LISTEN', name: '경청형', tone: '감정을 과장하지 않고 먼저 듣는다.' },
  { id: 'PERSONA_REALITY', name: '현실점검형', tone: '사실·감정·선택·책임을 분리한다.' },
  { id: 'PERSONA_RELATION', name: '관계회복형', tone: '도움·공경·화해·경계의 균형을 본다.' },
  { id: 'PERSONA_ACTION', name: '실천동행형', tone: '24시간 안의 작은 행동을 정한다.' },
  { id: 'PERSONA_GROWTH', name: '배움성장형', tone: '인내·일관성·지정의를 성장으로 연결한다.' }
];

var B365_DAILY5_LENSES = [
  ['본이 된다', '권위의 근거'],
  ['권위의 근거', '은사 사용'],
  ['일관성 유지', '인간관계 유지'],
  ['진보의 증거', '경건한 삶'],
  ['진보의 증거', '일관성 유지', '주님의 뜻']
];

function runBible365Daily5PipelineTick() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) throw new Error('B365_DAILY5_ALREADY_RUNNING');
  var started = new Date();
  var runId = 'B365D5_' + Utilities.formatDate(started, Session.getScriptTimeZone() || 'Asia/Seoul', 'yyyyMMdd_HHmmss');
  try {
    b365Daily5EnsureSheets_();
    var dayKey = Utilities.formatDate(started, Session.getScriptTimeZone() || 'Asia/Seoul', 'yyyy-MM-dd');

    // 기존 5개 큐 빌더가 있으면 큐까지만 재사용한다. 글 생성은 아래 새 T1/T2 규칙이 담당한다.
    try {
      if (typeof buildB365DailyQueue === 'function') buildB365DailyQueue();
    } catch (queueError) {
      b365Daily5Log_(runId, 'QUEUE_REUSE', 'WARN', String(queueError), 0, 0, 'QUEUE_REUSE_WARN');
    }

    var sources = b365Daily5SelectSources_(dayKey);
    if (!sources.length) throw new Error('B365_DAILY5_SOURCE_EMPTY');
    sources = sources.slice(0, B365_DAILY5_TARGET);

    var packages = [];
    for (var i = 0; i < sources.length; i++) {
      packages.push(b365Daily5BuildPackage_(dayKey, i + 1, sources[i]));
    }

    b365Daily5WritePackages_(packages, runId);
    var result = {
      ok: packages.length === B365_DAILY5_TARGET,
      version: B365_DAILY5_VERSION,
      templateId: B365_DAILY5_TEMPLATE_ID,
      runId: runId,
      dayKey: dayKey,
      target: B365_DAILY5_TARGET,
      produced: packages.length,
      frontReady: packages.filter(function(p) { return p.readyYn === 'Y'; }).length,
      publishMode: 'DRAFT_ONLY',
      triggerState: b365Daily5TriggerState_()
    };
    b365Daily5Log_(runId, 'FULL_CHAIN', result.ok ? 'DONE' : 'PARTIAL', JSON.stringify(result), sources.length, packages.length, result.ok ? 'READY' : 'PARTIAL');
    return result;
  } catch (error) {
    b365Daily5Log_(runId, 'FULL_CHAIN', 'ERROR', error && error.stack ? error.stack : String(error), 0, 0, 'ERROR');
    throw error;
  } finally {
    lock.releaseLock();
  }
}

function b365Daily5Health() {
  b365Daily5EnsureSheets_();
  var dayKey = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Seoul', 'yyyy-MM-dd');
  return {
    ok: true,
    version: B365_DAILY5_VERSION,
    templateId: B365_DAILY5_TEMPLATE_ID,
    dayKey: dayKey,
    target: B365_DAILY5_TARGET,
    queensToday: b365Daily5CountToday_(B365_DAILY5_SHEETS.QUEENS, dayKey),
    seedToday: b365Daily5CountToday_(B365_DAILY5_SHEETS.SEED, dayKey),
    t1Today: b365Daily5CountToday_(B365_DAILY5_SHEETS.T1, dayKey),
    t2Today: b365Daily5CountToday_(B365_DAILY5_SHEETS.T2, dayKey),
    frontToday: b365Daily5CountToday_(B365_DAILY5_SHEETS.FRONT, dayKey),
    triggerState: b365Daily5TriggerState_(),
    externalPublish: false
  };
}

/*
 * 기존 doGet에 아래처럼 연결:
 * var d5 = handleBible365Daily5DoGet(e); if (d5) return d5;
 */
function handleBible365Daily5DoGet(e) {
  var p = (e && e.parameter) || {};
  var action = String(p.action || '').toLowerCase();
  if (action === 'daily5_health') return b365Daily5Json_(b365Daily5Health());
  if (action === 'daily5_today' || action === 'daily5_latest') {
    var dayKey = action === 'daily5_today'
      ? Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Seoul', 'yyyy-MM-dd')
      : b365Daily5LatestDay_();
    return b365Daily5Json_(b365Daily5FrontPayload_(dayKey));
  }
  if (action === 'daily5_day') {
    return b365Daily5Json_(b365Daily5FrontPayload_(String(p.dayKey || '')));
  }
  return null;
}

function installOrReuseBible365Daily5Trigger() {
  var handlers = ScriptApp.getProjectTriggers().map(function(t) { return t.getHandlerFunction(); });
  var own = handlers.filter(function(h) { return h === 'runBible365Daily5PipelineTick'; });
  if (own.length > 1) {
    var keep = true;
    ScriptApp.getProjectTriggers().forEach(function(t) {
      if (t.getHandlerFunction() === 'runBible365Daily5PipelineTick') {
        if (keep) keep = false; else ScriptApp.deleteTrigger(t);
      }
    });
  }
  own = ScriptApp.getProjectTriggers().filter(function(t) { return t.getHandlerFunction() === 'runBible365Daily5PipelineTick'; });
  if (!own.length) {
    ScriptApp.newTrigger('runBible365Daily5PipelineTick').timeBased().everyHours(2).create();
  }
  return b365Daily5TriggerState_();
}

function pauseBible365Daily5Trigger() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'runBible365Daily5PipelineTick') ScriptApp.deleteTrigger(t);
  });
  return b365Daily5TriggerState_();
}

function b365Daily5TriggerState_() {
  var triggers = ScriptApp.getProjectTriggers().filter(function(t) {
    return t.getHandlerFunction() === 'runBible365Daily5PipelineTick';
  });
  return {
    handler: 'runBible365Daily5PipelineTick',
    count: triggers.length,
    installed: triggers.length === 1,
    duplicate: triggers.length > 1,
    schedule: 'EVERY_2_HOURS_IDEMPOTENT'
  };
}

function b365Daily5EnsureSheets_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var specs = {};
  specs[B365_DAILY5_SHEETS.QUEENS] = ['DATE','SLOT','QUEENS_ID','SOURCE_TYPE','PASSAGE_ID','BIBLE_REF','BIBLE_TEXT','SITUATION','THEME','USER_OR_MARKET_NEED','SOURCE_LINEAGE','RIGHTS','STATUS','UPDATED_AT'];
  specs[B365_DAILY5_SHEETS.SEED] = ['DATE','SLOT','SEED_ID','QUEENS_ID','PASSAGE_ID','BIBLE_REF','THEME','SITUATION','PERSONA_ID','PERSONA_NAME','LENSES','STORY_SEED','FRONT_USE','REUSE_PRIORITY','STATUS','UPDATED_AT'];
  specs[B365_DAILY5_SHEETS.T1] = ['DATE','SLOT','T1_ID','SEED_ID','PASSAGE_ID','BIBLE_REF','BIBLE_TEXT','PERSONA_ID','PERSONA_NAME','SITUATION','STORYBOARD','LENSES','HOOK','EMPATHY','PRINCIPLE','ACTION_24H','QUESTION','STATUS'];
  specs[B365_DAILY5_SHEETS.T2] = ['DATE','SLOT','T2_ID','T1_ID','SEED_ID','BIBLE_REF','PERSONA_ID','FRONT_LONG','YOUTUBE_SCRIPT','BLOG_NEWSLETTER','SHORT_SOCIAL','AUDIO_TEXT','TAGS','FRONT_ROUTE','PUBLISH_ROUTE','QA_FLAGS','STATUS','UPDATED_AT'];
  specs[B365_DAILY5_SHEETS.FRONT] = ['DATE','SLOT','PACKAGE_ID','T2_ID','BIBLE_REF','BIBLE_TEXT','TITLE','BODY','PERSONA_ID','PERSONA_NAME','YOUTUBE_SCRIPT','SHORT_SOCIAL','AUDIO_TEXT','TAGS','READY_YN','RUNTIME_STATE','SOURCE_LINEAGE','UPDATED_AT'];
  specs[B365_DAILY5_SHEETS.LOG] = ['RUN_AT','RUN_ID','STAGE','STATUS','DETAIL','INPUT_COUNT','OUTPUT_COUNT','TEMPLATE_ID','TRIGGER_STATE','NEXT_ACTION'];

  Object.keys(specs).forEach(function(name) {
    var sh = ss.getSheetByName(name) || ss.insertSheet(name);
    if (sh.getLastRow() === 0) sh.getRange(1, 1, 1, specs[name].length).setValues([specs[name]]);
  });
}

function b365Daily5SelectSources_(dayKey) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var out = [];
  var seen = {};

  // 1) 기존 Daily_Publish_Queue의 오늘 5개 Seed를 우선 재사용한다.
  var q = ss.getSheetByName('Daily_Publish_Queue');
  var db = ss.getSheetByName('DB_Map_New');
  if (q && db && q.getLastRow() > 1 && db.getLastRow() > 1) {
    var qv = q.getDataRange().getValues();
    var qh = b365Daily5Header_(qv[0]);
    var dv = db.getDataRange().getValues();
    var dh = b365Daily5Header_(dv[0]);
    var bySeed = {};
    for (var d = 1; d < dv.length; d++) {
      var sid = String(dv[d][dh.SEED_ID_FULL] || '').trim();
      if (sid) bySeed[sid] = dv[d];
    }
    for (var i = 1; i < qv.length; i++) {
      var qDay = b365Daily5DateKey_(qv[i][qh.QUEUE_DATE]);
      if (qDay !== dayKey) continue;
      var seedId = String(qv[i][qh.SEED_ID_FULL] || '').trim();
      if (!seedId || !bySeed[seedId] || seen[seedId]) continue;
      var r = bySeed[seedId];
      out.push({
        sourceType: 'DAILY_QUEUE_SEED',
        sourceId: seedId,
        passageId: '',
        bibleRef: '',
        bibleText: '',
        theme: [r[dh.C_KEYWORD], r[dh.D_KEYWORD], r[dh.E_KEYWORD]].filter(Boolean).join(' / '),
        situation: String(r[dh.REAL_SCENE_HOOK] || r[dh.SURFACE_DOMAIN] || '일상 상황'),
        emotion: String(r[dh.HIDDEN_EMOTION] || ''),
        action: String(r[dh.SMALL_ACTION] || ''),
        question: String(r[dh.TODAY_QUESTION] || ''),
        sourceLineage: 'Daily_Publish_Queue>' + seedId
      });
      seen[seedId] = true;
      if (out.length >= B365_DAILY5_TARGET) break;
    }
  }

  // 2) 부족하면 저장된 잠언 말씀을 사용한다. 잠언 1장 시작 데이터를 우선하여 첫 데이터 계보를 보존한다.
  if (out.length < B365_DAILY5_TARGET) {
    var lib = ss.getSheetByName('Bible_Passage_Library');
    if (lib && lib.getLastRow() > 1) {
      var lv = lib.getDataRange().getValues();
      var lh = b365Daily5Header_(lv[0]);
      var candidates = [];
      for (var j = 1; j < lv.length; j++) {
        if (String(lv[j][lh.ACTIVE] || '').toUpperCase() !== 'Y') continue;
        if (String(lv[j][lh.BOOK] || '') !== '잠언') continue;
        var ref = String(lv[j][lh.REF_DISPLAY] || '');
        var rank = /^잠언 1:[1-5]$/.test(ref) ? 0 : 1;
        candidates.push({ row: lv[j], rank: rank, index: j });
      }
      candidates.sort(function(a, b) { return a.rank - b.rank || a.index - b.index; });
      for (var c = 0; c < candidates.length && out.length < B365_DAILY5_TARGET; c++) {
        var x = candidates[c].row;
        var pid = String(x[lh.PASSAGE_ID] || '').trim();
        if (!pid || seen[pid]) continue;
        out.push({
          sourceType: 'BIBLE_PASSAGE_FALLBACK',
          sourceId: pid,
          passageId: pid,
          bibleRef: String(x[lh.REF_DISPLAY] || ''),
          bibleText: String(x[lh.TEXT_DISPLAY] || ''),
          theme: String(x[lh.CORE_THEMES] || '지혜'),
          situation: b365Daily5SituationFromPassage_(String(x[lh.CORE_EMOTIONS] || ''), String(x[lh.CORE_THEMES] || '')),
          emotion: String(x[lh.CORE_EMOTIONS] || ''),
          action: '',
          question: '',
          sourceLineage: 'Bible_Passage_Library>' + pid
        });
        seen[pid] = true;
      }
    }
  }

  return out;
}

function b365Daily5BuildPackage_(dayKey, slot, source) {
  var persona = B365_DAILY5_PERSONAS[(slot - 1) % B365_DAILY5_PERSONAS.length];
  var lenses = B365_DAILY5_LENSES[(slot - 1) % B365_DAILY5_LENSES.length];
  var ref = source.bibleRef || '본문 자동매칭 대기';
  var text = source.bibleText || '';
  var passage = (!text && source.sourceType === 'DAILY_QUEUE_SEED') ? b365Daily5MatchPassage_(source, slot) : null;
  if (passage) {
    source.passageId = passage.passageId;
    ref = passage.ref;
    text = passage.text;
  }

  var base = dayKey.replace(/-/g, '') + '_S' + slot;
  var qid = 'Q_D5_' + base;
  var sid = 'SEED_D5_' + base;
  var t1id = 'T1_D5_' + base;
  var t2id = 'T2_D5_' + base;
  var pkgid = 'PKG_D5_' + base;
  var situation = source.situation || '오늘의 말씀을 삶에 연결하는 상황';
  var theme = source.theme || '지혜';
  var action = source.action || b365Daily5DefaultAction_(slot);
  var question = source.question || b365Daily5DefaultQuestion_(slot);
  var title = b365Daily5Title_(ref, theme, slot);
  var lensText = lenses.join(' / ');
  var hook = situation;
  var empathy = source.emotion ? '마음에는 ' + source.emotion + ' 같은 감정이 섞일 수 있다.' : '말씀을 알고 있어도 실제 행동으로 옮기는 일은 쉽지 않다.';
  var principle = b365Daily5Principle_(lenses, ref);
  var body = [
    hook,
    empathy,
    ref + (text ? ' — ' + text : ''),
    principle,
    '오늘의 작은 행동: ' + action,
    '묵상 질문: ' + question
  ].filter(Boolean).join('\n\n');

  var youtube = [
    '[HOOK] ' + hook,
    '[WORD] ' + ref + (text ? ' — ' + text : ''),
    '[INSIGHT] ' + principle,
    '[ACTION] ' + action,
    '[QUESTION] ' + question
  ].join('\n');
  var shortSocial = title + '\n' + principle + '\n오늘 한 가지: ' + action + '\n#성경365 #잠언 #묵상 #지혜';
  var tags = ['성경365','잠언','묵상','지혜',persona.name].join(',');
  var qaFlags = ['SCRIPTURE_CONTEXT_REQUIRED','USER_CORRECTION_PRIORITY','NO_CONDEMNATION_OR_OVERCLAIM','PRACTICAL_ACTION_PRESENT','NO_NAMED_PASTOR_COUNSELOR_LABEL'];

  return {
    date: dayKey,
    slot: slot,
    queensId: qid,
    seedId: sid,
    t1Id: t1id,
    t2Id: t2id,
    packageId: pkgid,
    passageId: source.passageId || '',
    bibleRef: ref,
    bibleText: text,
    theme: theme,
    situation: situation,
    sourceType: source.sourceType,
    sourceLineage: source.sourceLineage,
    persona: persona,
    lenses: lenses,
    title: title,
    hook: hook,
    empathy: empathy,
    principle: principle,
    action: action,
    question: question,
    frontLong: body,
    youtubeScript: youtube,
    blogNewsletter: '## ' + title + '\n\n' + body,
    shortSocial: shortSocial,
    audioText: body.replace(/\n+/g, ' '),
    tags: tags,
    qaFlags: qaFlags.join(','),
    readyYn: (ref && text) ? 'Y' : 'N',
    runtimeState: 'STORED_RULE_V1'
  };
}

function b365Daily5WritePackages_(packages, runId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  packages.forEach(function(p) {
    b365Daily5Upsert_(ss.getSheetByName(B365_DAILY5_SHEETS.QUEENS), p.date + '|' + p.slot, [
      p.date,p.slot,p.queensId,p.sourceType,p.passageId,p.bibleRef,p.bibleText,p.situation,p.theme,'매일 말씀+5개 글의 실제 생활 연결',p.sourceLineage,'INTERNAL_VERIFIED_SOURCE','QUALIFIED',new Date()
    ]);
    b365Daily5Upsert_(ss.getSheetByName(B365_DAILY5_SHEETS.SEED), p.date + '|' + p.slot, [
      p.date,p.slot,p.seedId,p.queensId,p.passageId,p.bibleRef,p.theme,p.situation,p.persona.id,p.persona.name,p.lenses.join(' / '),p.hook+' -> '+p.principle+' -> '+p.action,'FRONT_DAILY5','HIGH','QUALIFIED',new Date()
    ]);
    b365Daily5Upsert_(ss.getSheetByName(B365_DAILY5_SHEETS.T1), p.date + '|' + p.slot, [
      p.date,p.slot,p.t1Id,p.seedId,p.passageId,p.bibleRef,p.bibleText,p.persona.id,p.persona.name,p.situation,'상황→본문문맥→필요렌즈→스토리→관계/실천→질문',p.lenses.join(' / '),p.hook,p.empathy,p.principle,p.action,p.question,'QUALIFIED_T1'
    ]);
    b365Daily5Upsert_(ss.getSheetByName(B365_DAILY5_SHEETS.T2), p.date + '|' + p.slot, [
      p.date,p.slot,p.t2Id,p.t1Id,p.seedId,p.bibleRef,p.persona.id,p.frontLong,p.youtubeScript,p.blogNewsletter,p.shortSocial,p.audioText,p.tags,'APP_BIBLE365','DRAFT_ONLY',p.qaFlags,p.readyYn === 'Y' ? 'READY' : 'NEEDS_SCRIPTURE',new Date()
    ]);
    b365Daily5Upsert_(ss.getSheetByName(B365_DAILY5_SHEETS.FRONT), p.date + '|' + p.slot, [
      p.date,p.slot,p.packageId,p.t2Id,p.bibleRef,p.bibleText,p.title,p.frontLong,p.persona.id,p.persona.name,p.youtubeScript,p.shortSocial,p.audioText,p.tags,p.readyYn,p.runtimeState,p.sourceLineage,new Date()
    ]);
  });
}

function b365Daily5FrontPayload_(dayKey) {
  b365Daily5EnsureSheets_();
  if (!dayKey) return { success: false, items: [], error: 'DAY_KEY_REQUIRED' };
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(B365_DAILY5_SHEETS.FRONT);
  var v = sh.getDataRange().getValues();
  var h = b365Daily5Header_(v[0]);
  var items = [];
  for (var i = 1; i < v.length; i++) {
    if (b365Daily5DateKey_(v[i][h.DATE]) !== dayKey) continue;
    if (String(v[i][h.READY_YN] || '') !== 'Y') continue;
    var title = String(v[i][h.TITLE] || '');
    var body = String(v[i][h.BODY] || '');
    items.push({
      slot: Number(v[i][h.SLOT] || 0),
      id: String(v[i][h.PACKAGE_ID] || ''),
      situation: String(v[i][h.PERSONA_NAME] || '') + ' · ' + title,
      dry: { title: title, body: body },
      devotion: { title: title, body: body },
      merged: body,
      audio: {},
      tags: String(v[i][h.TAGS] || '').split(',').filter(Boolean),
      status: String(v[i][h.RUNTIME_STATE] || ''),
      bible: { ref: String(v[i][h.BIBLE_REF] || ''), text: String(v[i][h.BIBLE_TEXT] || '') },
      youtube: String(v[i][h.YOUTUBE_SCRIPT] || ''),
      createdAt: String(v[i][h.UPDATED_AT] || '')
    });
  }
  items.sort(function(a,b){ return a.slot-b.slot; });
  return {
    success: items.length > 0,
    dayKey: dayKey,
    items: items,
    updatedAt: new Date().toISOString(),
    meta: { version: B365_DAILY5_VERSION, templateId: B365_DAILY5_TEMPLATE_ID, target: B365_DAILY5_TARGET, produced: items.length, publishMode: 'DRAFT_ONLY' }
  };
}

function b365Daily5LatestDay_() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(B365_DAILY5_SHEETS.FRONT);
  if (!sh || sh.getLastRow() < 2) return Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Seoul', 'yyyy-MM-dd');
  var v = sh.getDataRange().getValues();
  var h = b365Daily5Header_(v[0]);
  var days = [];
  for (var i=1;i<v.length;i++) { var d=b365Daily5DateKey_(v[i][h.DATE]); if(d) days.push(d); }
  days.sort();
  return days.length ? days[days.length-1] : Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Seoul', 'yyyy-MM-dd');
}

function b365Daily5MatchPassage_(source, slot) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('Bible_Passage_Library');
  if (!sh || sh.getLastRow() < 2) return null;
  var v=sh.getDataRange().getValues(), h=b365Daily5Header_(v[0]);
  var words=(source.theme+' '+source.situation+' '+source.emotion).split(/[\s,\/·]+/).filter(Boolean);
  var best=null, bestScore=-1;
  for(var i=1;i<v.length;i++){
    if(String(v[i][h.ACTIVE]||'').toUpperCase()!=='Y') continue;
    var hay=[v[i][h.CORE_THEMES],v[i][h.CORE_EMOTIONS],v[i][h.CATEGORY_HINTS]].join(' ');
    var score=0;
    words.forEach(function(w){ if(w.length>1 && hay.indexOf(w)>=0) score++; });
    if(String(v[i][h.BOOK]||'')==='잠언') score+=0.25;
    if(score>bestScore){
      bestScore=score;
      best={passageId:String(v[i][h.PASSAGE_ID]||''),ref:String(v[i][h.REF_DISPLAY]||''),text:String(v[i][h.TEXT_DISPLAY]||'')};
    }
  }
  return best;
}

function b365Daily5SituationFromPassage_(emotions, themes) {
  var e = String(emotions || '');
  if (e.indexOf('불안') >= 0) return '걱정과 통제 욕구가 올라올 때';
  if (e.indexOf('갈등') >= 0 || e.indexOf('분노') >= 0) return '관계에서 말과 반응이 거칠어질 때';
  if (e.indexOf('낙심') >= 0 || e.indexOf('실패') >= 0) return '넘어진 뒤 다시 시작하기 어려울 때';
  return '알고 있는 말씀을 오늘 행동으로 옮겨야 할 때';
}

function b365Daily5Title_(ref, theme, slot) {
  var stems = ['아는 것에서 사는 것으로','내 판단보다 먼저 확인할 것','관계를 살리는 지혜','오늘 한 걸음의 지혜','배움을 멈추지 않는 사람'];
  return stems[(slot - 1) % stems.length] + (ref ? ' · ' + ref : '') + (theme ? ' · ' + String(theme).split(',')[0] : '');
}

function b365Daily5Principle_(lenses, ref) {
  var map = {
    '본이 된다':'말씀은 말로만 설명하기보다 행실·사랑·믿음에서 보일 때 힘을 가진다.',
    '권위의 근거':'권위는 지위보다 말씀에 대한 실제 행동에서 확인된다.',
    '은사 사용':'받은 은사는 사적인 욕심이 아니라 가르침·권면·사람을 세우는 데 사용한다.',
    '진보의 증거':'성장은 한 번의 감정이 아니라 인내와 반복되는 변화로 확인한다.',
    '일관성 유지':'신앙은 순간적인 열심보다 삶에서 계속되는 일관성으로 드러난다.',
    '인간관계 유지':'도움이 필요한 사람을 살피고 마땅한 공경과 건강한 경계를 함께 지킨다.',
    '경건한 삶':'지·정·의가 따로 놀지 않도록 알고 느끼고 선택하는 삶을 하나로 묶는다.',
    '주님의 뜻':'건강한 섬김은 서로 가르치고 배우며 사람을 세우는 방향으로 간다.'
  };
  return lenses.map(function(x){return map[x]||x;}).join(' ') + (ref ? ' 이 원칙을 ' + ref + '의 문맥과 함께 살핀다.' : '');
}

function b365Daily5DefaultAction_(slot) {
  return [
    '오늘 한 문장을 골라 말이 아니라 행동 한 가지로 옮긴다.',
    '결정 전에 사실·감정·욕심을 나눠 적고 말씀 기준으로 다시 본다.',
    '한 사람에게 먼저 도움·공경·경청 중 하나를 실천한다.',
    '지금 피하고 있는 작은 일을 10분만 시작하고 끝에 배운 점을 기록한다.',
    '오늘 배운 것을 한 사람에게 짧게 설명하고 그 사람에게서도 한 가지를 배운다.'
  ][(slot-1)%5];
}

function b365Daily5DefaultQuestion_(slot) {
  return [
    '오늘 내 믿음은 어떤 행동으로 보일 수 있는가?',
    '내 선택에서 말씀보다 앞서고 있는 개인적 욕심은 무엇인가?',
    '내가 먼저 도울 사람과 공경해야 할 사람은 누구인가?',
    '지금의 어려움 속에서 인내로 남길 수 있는 작은 진보는 무엇인가?',
    '나는 오늘 누구를 가르치기 전에 무엇을 배우고 섬길 것인가?'
  ][(slot-1)%5];
}

function b365Daily5Upsert_(sh, key, row) {
  var last = sh.getLastRow();
  if (last > 1) {
    var vals = sh.getRange(2,1,last-1,2).getDisplayValues();
    for (var i=0;i<vals.length;i++) {
      if (String(vals[i][0]) + '|' + String(vals[i][1]) === key) {
        sh.getRange(i+2,1,1,row.length).setValues([row]);
        return i+2;
      }
    }
  }
  sh.getRange(sh.getLastRow()+1,1,1,row.length).setValues([row]);
  return sh.getLastRow();
}

function b365Daily5CountToday_(sheetName, dayKey) {
  var sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if(!sh||sh.getLastRow()<2)return 0;
  var vals=sh.getRange(2,1,sh.getLastRow()-1,1).getDisplayValues();
  return vals.filter(function(r){return b365Daily5DateKey_(r[0])===dayKey;}).length;
}

function b365Daily5Header_(header) {
  var h={};
  (header||[]).forEach(function(v,i){h[String(v||'').trim()]=i;});
  return h;
}

function b365Daily5DateKey_(v) {
  if (Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v.getTime())) return Utilities.formatDate(v, Session.getScriptTimeZone() || 'Asia/Seoul', 'yyyy-MM-dd');
  var s=String(v||'').trim();
  var m=s.match(/\d{4}-\d{2}-\d{2}/);
  return m?m[0]:'';
}

function b365Daily5Json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function b365Daily5Log_(runId, stage, status, detail, inputCount, outputCount, nextAction) {
  try {
    b365Daily5EnsureSheets_();
    var sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(B365_DAILY5_SHEETS.LOG);
    sh.appendRow([new Date(),runId,stage,status,String(detail||'').slice(0,12000),inputCount||0,outputCount||0,B365_DAILY5_TEMPLATE_ID,JSON.stringify(b365Daily5TriggerState_()),nextAction||'']);
  } catch (_) {}
}
