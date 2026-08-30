/*
 * Bible365_Counsel_QueensSeed_Pipeline_v20260830.gs
 *
 * 목적
 * 1) Bible365 '글·상담' 요청을 Queens로 수집한다.
 * 2) 상황/문제 카테고리 + Persona를 Seed로 데이터화한다.
 * 3) DRYWRITER_BIBLE_COUNSEL_V1_20260830 기준의 T1 Storyboard를 미리 생산한다.
 * 4) 요청 시 검증 가능한 T1 Seed 중 하나를 개인화 랜덤 선택하여 T2 Front Package로 조립한다.
 * 5) 상담 UI/응답에서 특정 목회자를 상담자 이름으로 사용하지 않는다.
 *
 * 중요
 * - 이 파일은 기존 doGet/doPost를 덮어쓰지 않는다.
 * - 기존 WebApp router에서 handleBible365CounselDoGet(e) / handleBible365CounselDoPost(e)를 호출한다.
 * - 외부 생성형 API를 기본 사용하지 않는다. 기존 Bible365 저장 백데이터 + Seed/T1 재사용 우선이다.
 */

var B365C_VERSION = 'B365_COUNSEL_V1_20260830';
var B365C_TEMPLATE_ID = 'DRYWRITER_BIBLE_COUNSEL_V1_20260830';
var B365C_TRIGGER_HANDLER = 'b365CounselPipelineTick';

var B365C_SHEETS = {
  QUEENS: '성경365_상담_Queens',
  SEED: '성경365_상담_Seed',
  PERSONA: '성경365_상담_Persona',
  T1: '성경365_상담_T1_Template',
  T2: '성경365_상담_T2_Delivery',
  LOG: '성경365_상담_Run_Log'
};

var B365C_SITUATIONS = [
  { id: 'SIT_ANXIETY', name: '불안_걱정', keywords: ['불안','걱정','두려움','초조','잠이 안','마음이 복잡'] },
  { id: 'SIT_FAMILY', name: '가족_관계갈등', keywords: ['가족','부부','자녀','부모','갈등','다툼','관계','용서'] },
  { id: 'SIT_CAREER', name: '직장_진로_결정', keywords: ['직장','진로','이직','퇴사','결정','선택','사업','학교'] },
  { id: 'SIT_FINANCE', name: '경제_재정압박', keywords: ['돈','경제','재정','빚','부채','수입','지출','생활비'] },
  { id: 'SIT_GUILT', name: '실패_죄책감', keywords: ['실패','죄책감','후회','잘못','실수','자책','용납'] },
  { id: 'SIT_GRIEF', name: '상실_슬픔', keywords: ['상실','슬픔','죽음','이별','아픔','병원','눈물'] },
  { id: 'SIT_LONELY', name: '외로움_소외', keywords: ['외로움','소외','혼자','고립','친구','사람이 없다'] },
  { id: 'SIT_BURNOUT', name: '봉사_소진', keywords: ['봉사','섬김','지침','소진','교회일','사역','피곤','번아웃'] }
];

var B365C_PERSONAS = [
  { id: 'PERSONA_LISTEN', name: '경청형', tone: '담담하게 상황을 듣고 감정을 과장하지 않는다.' },
  { id: 'PERSONA_REALITY', name: '현실점검형', tone: '사실·감정·선택·책임을 분리해 명료하게 점검한다.' },
  { id: 'PERSONA_RELATION', name: '관계회복형', tone: '도움·공경·화해·건강한 경계의 균형을 점검한다.' },
  { id: 'PERSONA_ACTION', name: '실천동행형', tone: '24시간 안에 가능한 작고 구체적인 행동을 제안한다.' },
  { id: 'PERSONA_GROWTH', name: '배움성장형', tone: '인내·일관성·지정의를 성장의 증거로 연결한다.' }
];

var B365C_LENS8 = [
  '본이 된다 — 행실·사랑·믿음',
  '권위의 근거 — 말씀에 대한 행동',
  '은사 사용 — 사적 욕심 X / 말씀·가르침·권면',
  '진보의 증거 — 인내·승리',
  '일관성 유지 — 전도·선교',
  '인간관계 유지 — 도움이 필요한 자·공경',
  '경건한 삶 — 신앙 안에서 지·정·의',
  '주님의 뜻 — 건강한 섬김 / 가르치고 배우라'
];

function b365CounselBootstrap() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    b365CounselEnsureSheets_(ss);
    b365CounselWritePersonas_(ss);
    var seedCount = b365CounselWriteSeedMatrix_(ss);
    b365CounselLog_(ss, 'BOOTSTRAP', 'DONE', { seedCount: seedCount, version: B365C_VERSION });
    return { success: true, version: B365C_VERSION, seedCount: seedCount, templateId: B365C_TEMPLATE_ID };
  } finally {
    lock.releaseLock();
  }
}

function b365CounselPipelineTick() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  b365CounselEnsureSheets_(ss);
  var q = ss.getSheetByName(B365C_SHEETS.QUEENS);
  if (!q || q.getLastRow() < 2) return { success: true, processed: 0 };

  var values = q.getRange(2, 1, q.getLastRow() - 1, q.getLastColumn()).getValues();
  var processed = 0;
  for (var i = 0; i < values.length && processed < 20; i++) {
    if (String(values[i][10] || '') !== 'READY') continue; // STATUS col K
    try {
      b365CounselProcessRequest_(ss, values[i], i + 2);
      processed++;
    } catch (err) {
      q.getRange(i + 2, 11).setValue('ERROR');
      q.getRange(i + 2, 12).setValue(String(err).slice(0, 1000));
      b365CounselLog_(ss, 'PIPELINE', 'ERROR', { row: i + 2, error: String(err) });
    }
  }
  return { success: true, processed: processed };
}

function b365CounselEnqueue(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  b365CounselEnsureSheets_(ss);
  if (ss.getSheetByName(B365C_SHEETS.T1).getLastRow() < 2) b365CounselBootstrap();

  payload = payload || {};
  var now = new Date();
  var requestId = payload.requestId || ('COUNSEL_' + Utilities.formatDate(now, Session.getScriptTimeZone() || 'Asia/Seoul', 'yyyyMMdd_HHmmss') + '_' + Math.floor(Math.random() * 100000));
  var question = b365CounselText_(payload.question || payload.query);
  if (!question) throw new Error('COUNSEL_QUESTION_REQUIRED');

  var row = [
    requestId,
    now,
    b365CounselText_(payload.sessionKey),
    b365CounselText_(payload.audience || '본인'),
    b365CounselText_(payload.lang || 'KO'),
    question,
    b365CounselText_(payload.verseRef),
    b365CounselText_(payload.verseText),
    b365CounselText_(payload.theme),
    b365CounselText_(payload.application),
    'READY',
    '',
    '',
    '',
    B365C_TEMPLATE_ID,
    B365C_VERSION
  ];
  var sh = ss.getSheetByName(B365C_SHEETS.QUEENS);
  sh.appendRow(row);
  var rowIndex = sh.getLastRow();

  // 상담 UX는 즉시 응답이 유용하므로 1건은 enqueue 직후 처리한다.
  var result = b365CounselProcessRequest_(ss, row, rowIndex);
  return result;
}

function b365CounselProcessRequest_(ss, qRow, qRowIndex) {
  var requestId = String(qRow[0]);
  var question = String(qRow[5] || '');
  var verseRef = String(qRow[6] || '');
  var verseText = String(qRow[7] || '');
  var theme = String(qRow[8] || '');
  var application = String(qRow[9] || '');
  var sessionKey = String(qRow[2] || requestId);

  var situation = b365CounselClassifySituation_(question + ' ' + theme);
  var persona = b365CounselPickPersona_(sessionKey, requestId);
  var t1 = b365CounselFindT1_(ss, situation.id, persona.id);
  if (!t1) throw new Error('COUNSEL_T1_SEED_NOT_FOUND: ' + situation.id + '/' + persona.id);

  var seedId = 'SEED_' + situation.id + '_' + persona.id;
  b365CounselUpsertRequestSeed_(ss, {
    requestId: requestId,
    seedId: seedId,
    situation: situation,
    persona: persona,
    question: question,
    verseRef: verseRef,
    theme: theme
  });

  var t2 = b365CounselAssembleT2_({
    requestId: requestId,
    question: question,
    verseRef: verseRef,
    verseText: verseText,
    theme: theme,
    application: application,
    situation: situation,
    persona: persona,
    t1: t1
  });

  var t2Sheet = ss.getSheetByName(B365C_SHEETS.T2);
  t2Sheet.appendRow([
    requestId,
    new Date(),
    seedId,
    t1.t1Id,
    situation.id,
    situation.name,
    persona.id,
    persona.name,
    B365C_TEMPLATE_ID,
    JSON.stringify(t2),
    'READY_FOR_FRONT',
    B365C_VERSION
  ]);

  var q = ss.getSheetByName(B365C_SHEETS.QUEENS);
  q.getRange(qRowIndex, 11, 1, 4).setValues([['DONE', '', situation.id, persona.id]]);
  b365CounselLog_(ss, 'PROCESS', 'DONE', { requestId: requestId, situation: situation.id, persona: persona.id, t1Id: t1.t1Id });
  return { success: true, requestId: requestId, package: t2, status: 'READY_FOR_FRONT' };
}

function b365CounselGetResult(requestId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(B365C_SHEETS.T2);
  if (!sh || sh.getLastRow() < 2) return { success: false, error: 'COUNSEL_RESULT_NOT_FOUND' };
  var data = sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getDisplayValues();
  for (var i = data.length - 1; i >= 0; i--) {
    if (data[i][0] === requestId) {
      return { success: true, requestId: requestId, package: JSON.parse(data[i][9]), status: data[i][10] };
    }
  }
  return { success: false, error: 'COUNSEL_RESULT_NOT_FOUND' };
}

function b365CounselRandomPreview(params) {
  params = params || {};
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  b365CounselEnsureSheets_(ss);
  if (ss.getSheetByName(B365C_SHEETS.T1).getLastRow() < 2) b365CounselBootstrap();
  var situation = b365CounselSituationByIdOrName_(params.situation) || B365C_SITUATIONS[Math.floor(Math.random() * B365C_SITUATIONS.length)];
  var persona = b365CounselPickPersona_(String(params.sessionKey || 'preview'), String(params.requestId || new Date().getTime()));
  var t1 = b365CounselFindT1_(ss, situation.id, persona.id);
  return {
    success: true,
    seed: {
      situation: situation,
      persona: persona,
      t1Id: t1 && t1.t1Id,
      storyboard: t1 && t1.storyboard,
      templateId: B365C_TEMPLATE_ID
    }
  };
}

function b365CounselHealth() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  b365CounselEnsureSheets_(ss);
  var counts = {};
  Object.keys(B365C_SHEETS).forEach(function(k) {
    var sh = ss.getSheetByName(B365C_SHEETS[k]);
    counts[k] = Math.max(0, (sh ? sh.getLastRow() : 1) - 1);
  });
  return {
    success: true,
    version: B365C_VERSION,
    templateId: B365C_TEMPLATE_ID,
    counts: counts,
    namedPastorCounselorLabelAllowed: false,
    status: counts.T1 >= (B365C_SITUATIONS.length * B365C_PERSONAS.length) ? 'SEED_READY' : 'BOOTSTRAP_REQUIRED'
  };
}

function installBible365CounselTrigger() {
  removeBible365CounselTrigger_();
  ScriptApp.newTrigger(B365C_TRIGGER_HANDLER).timeBased().everyMinutes(10).create();
  return { success: true, handler: B365C_TRIGGER_HANDLER, everyMinutes: 10 };
}

function removeBible365CounselTrigger_() {
  ScriptApp.getProjectTriggers()
    .filter(function(t) { return t.getHandlerFunction() === B365C_TRIGGER_HANDLER; })
    .forEach(function(t) { ScriptApp.deleteTrigger(t); });
}

/* Existing WebApp router adapter */
function handleBible365CounselDoGet(e) {
  var p = (e && e.parameter) || {};
  var action = String(p.action || p.type || 'counsel_health');
  var result;
  if (action === 'counsel_health') result = b365CounselHealth();
  else if (action === 'counsel_result') result = b365CounselGetResult(String(p.requestId || ''));
  else if (action === 'counsel_random') result = b365CounselRandomPreview(p);
  else if (action === 'counsel_bootstrap') result = b365CounselBootstrap();
  else return null; // 기존 router가 다른 action을 계속 처리하도록 null 반환
  return b365CounselJson_(result, p.callback);
}

function handleBible365CounselDoPost(e) {
  var body = {};
  try { body = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (_) {}
  var action = String(body.action || 'counsel_enqueue');
  if (action !== 'counsel_enqueue') return null;
  return b365CounselJson_(b365CounselEnqueue(body), body.callback);
}

function b365CounselEnsureSheets_(ss) {
  var specs = {};
  specs[B365C_SHEETS.QUEENS] = ['REQUEST_ID','CREATED_AT','SESSION_KEY','AUDIENCE','LANG','QUESTION','VERSE_REF','VERSE_TEXT','THEME','APPLICATION','STATUS','ERROR','SITUATION_ID','PERSONA_ID','TEMPLATE_ID','VERSION'];
  specs[B365C_SHEETS.SEED] = ['SEED_ID','REQUEST_ID','CREATED_AT','SITUATION_ID','SITUATION_NAME','PERSONA_ID','PERSONA_NAME','QUESTION','VERSE_REF','THEME','TEMPLATE_ID','STATUS','LINEAGE_JSON'];
  specs[B365C_SHEETS.PERSONA] = ['PERSONA_ID','PERSONA_NAME','TONE','STATUS','VERSION'];
  specs[B365C_SHEETS.T1] = ['T1_ID','SITUATION_ID','SITUATION_NAME','PERSONA_ID','PERSONA_NAME','TEMPLATE_ID','STORYBOARD_JSON','SEED_BODY','STATUS','VERSION'];
  specs[B365C_SHEETS.T2] = ['REQUEST_ID','CREATED_AT','SEED_ID','T1_ID','SITUATION_ID','SITUATION_NAME','PERSONA_ID','PERSONA_NAME','TEMPLATE_ID','PACKAGE_JSON','STATUS','VERSION'];
  specs[B365C_SHEETS.LOG] = ['LOG_AT','STAGE','STATUS','DETAIL_JSON','VERSION'];
  Object.keys(specs).forEach(function(name) {
    var sh = ss.getSheetByName(name) || ss.insertSheet(name);
    if (sh.getLastRow() === 0) sh.getRange(1, 1, 1, specs[name].length).setValues([specs[name]]);
  });
}

function b365CounselWritePersonas_(ss) {
  var sh = ss.getSheetByName(B365C_SHEETS.PERSONA);
  if (sh.getLastRow() > 1) return;
  var rows = B365C_PERSONAS.map(function(p) { return [p.id, p.name, p.tone, 'ACTIVE', B365C_VERSION]; });
  sh.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
}

function b365CounselWriteSeedMatrix_(ss) {
  var sh = ss.getSheetByName(B365C_SHEETS.T1);
  if (sh.getLastRow() > 1) return sh.getLastRow() - 1;
  var rows = [];
  B365C_SITUATIONS.forEach(function(s) {
    B365C_PERSONAS.forEach(function(p) {
      var t1Id = 'T1_' + s.id + '_' + p.id;
      var storyboard = b365CounselStoryboard_(s, p);
      rows.push([
        t1Id, s.id, s.name, p.id, p.name, B365C_TEMPLATE_ID,
        JSON.stringify(storyboard), b365CounselSeedBody_(s, p), 'QUALIFIED_PRESEED', B365C_VERSION
      ]);
    });
  });
  sh.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  return rows.length;
}

function b365CounselStoryboard_(s, p) {
  return {
    titleRule: s.name + ' 상황을 말씀 앞에서 점검하는 글·상담',
    persona: { id: p.id, name: p.name, tone: p.tone },
    sections: [
      '현재 상황: 사실·감정·선택을 분리',
      '본문 확인: 구절 단독 인용 금지, 앞뒤 문맥 점검',
      '핵심 렌즈: 8개 중 2~4개를 우선 적용',
      '관계 점검: 도움·공경·섬김 대상 확인',
      '오늘 멈출 것 / 시작할 것 / 유지할 것',
      '24시간 안의 한 가지 행동',
      '묵상 질문 2~3개',
      '짧은 마무리'
    ],
    lens8: B365C_LENS8,
    guardrails: ['특정 목회자를 상담자 페르소나로 표시하지 않음','사적 욕심이 본문보다 앞서지 않음','정죄·공포·영적 과장 금지']
  };
}

function b365CounselSeedBody_(s, p) {
  return [
    '상황: ' + s.name,
    '페르소나: ' + p.name,
    '톤: ' + p.tone,
    '시작: 지금 겪는 일을 사실과 감정으로 나누어 짧게 정리한다.',
    '말씀: 입력된 본문과 앞뒤 문맥을 확인한 뒤 상황과 연결한다.',
    '점검: 본·권위·은사·진보·일관성·인간관계·지정의·건강한 섬김 중 필요한 렌즈를 선택한다.',
    '실행: 오늘 멈출 것 1개, 시작할 것 1개, 유지할 것 1개를 정한다.',
    '완료: 24시간 안에 가능한 행동 1개와 묵상 질문으로 마무리한다.'
  ].join('\n');
}

function b365CounselClassifySituation_(text) {
  text = String(text || '').toLowerCase();
  var best = B365C_SITUATIONS[0];
  var bestScore = -1;
  B365C_SITUATIONS.forEach(function(s) {
    var score = 0;
    s.keywords.forEach(function(k) { if (text.indexOf(String(k).toLowerCase()) !== -1) score++; });
    if (score > bestScore) { best = s; bestScore = score; }
  });
  return best;
}

function b365CounselPickPersona_(sessionKey, requestId) {
  var key = String(sessionKey || '') + '|' + String(requestId || '');
  var hash = 0;
  for (var i = 0; i < key.length; i++) hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0;
  var index = Math.abs(hash) % B365C_PERSONAS.length;
  return B365C_PERSONAS[index];
}

function b365CounselFindT1_(ss, situationId, personaId) {
  var sh = ss.getSheetByName(B365C_SHEETS.T1);
  var rows = sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getDisplayValues();
  for (var i = 0; i < rows.length; i++) {
    if (rows[i][1] === situationId && rows[i][3] === personaId && rows[i][8] === 'QUALIFIED_PRESEED') {
      return { t1Id: rows[i][0], storyboard: JSON.parse(rows[i][6]), seedBody: rows[i][7] };
    }
  }
  return null;
}

function b365CounselUpsertRequestSeed_(ss, d) {
  var sh = ss.getSheetByName(B365C_SHEETS.SEED);
  var seedId = 'SEED_' + d.situation.id + '_' + d.persona.id + '_' + d.requestId;
  sh.appendRow([
    seedId, d.requestId, new Date(), d.situation.id, d.situation.name, d.persona.id, d.persona.name,
    d.question, d.verseRef, d.theme, B365C_TEMPLATE_ID, 'QUALIFIED',
    JSON.stringify({ source: 'QUEENS', template: B365C_TEMPLATE_ID, t1: 'T1_' + d.situation.id + '_' + d.persona.id })
  ]);
}

function b365CounselAssembleT2_(d) {
  return {
    version: B365C_VERSION,
    templateId: B365C_TEMPLATE_ID,
    requestId: d.requestId,
    uiTitle: '글·상담',
    counselorLabel: '',
    namedPastorCounselor: false,
    personalization: {
      mode: 'RANDOM_FROM_QUALIFIED_T1_SEEDS',
      situationId: d.situation.id,
      situationName: d.situation.name,
      personaId: d.persona.id,
      personaName: d.persona.name,
      tone: d.persona.tone
    },
    scripture: { ref: d.verseRef, text: d.verseText, theme: d.theme, application: d.application },
    userQuestion: d.question,
    t1Id: d.t1.t1Id,
    storyboard: d.t1.storyboard,
    draftSeed: d.t1.seedBody,
    outputGuide: {
      title: '본문의 핵심과 현재 고민을 함께 드러내는 짧은 제목',
      brief: '한 줄 브리프',
      blocks: ['본문이 말하는 것','내 상황에 비추기','8개 렌즈 점검','오늘의 상담 포인트','오늘의 한 가지 행동','묵상 질문','기도/마무리']
    },
    qa: ['SCRIPTURE_CONTEXT_PASS','NO_PRIVATE_DESIRE_OVERRIDE','NO_CONDEMNATION_OR_SPIRITUAL_OVERCLAIM','PRACTICAL_ACTION_PRESENT','NO_NAMED_PASTOR_COUNSELOR_LABEL'],
    status: 'T2_FRONT_READY'
  };
}

function b365CounselSituationByIdOrName_(value) {
  value = String(value || '');
  for (var i = 0; i < B365C_SITUATIONS.length; i++) {
    if (B365C_SITUATIONS[i].id === value || B365C_SITUATIONS[i].name === value) return B365C_SITUATIONS[i];
  }
  return null;
}

function b365CounselText_(v) { return String(v === null || v === undefined ? '' : v).trim().slice(0, 12000); }

function b365CounselLog_(ss, stage, status, detail) {
  var sh = ss.getSheetByName(B365C_SHEETS.LOG);
  sh.appendRow([new Date(), stage, status, JSON.stringify(detail || {}), B365C_VERSION]);
}

function b365CounselJson_(obj, callback) {
  var text = JSON.stringify(obj || {});
  if (callback) return ContentService.createTextOutput(String(callback) + '(' + text + ')').setMimeType(ContentService.MimeType.JAVASCRIPT);
  return ContentService.createTextOutput(text).setMimeType(ContentService.MimeType.JSON);
}
