/* Bible365 Daily5 runtime - 2026-09-06 */
const B365D5_VERSION = 'B365_DAILY5_RUNTIME_V2_DATE_NORMALIZE_20260906';
const B365D5_CANONICAL_ID = '1HK4ATRZ-lSZ4fyuZi4ypHodgGZK1kBMsEFkAxOm9904';

function b365d5SS_() {
  var ss = SpreadsheetApp.openById(B365D5_CANONICAL_ID);
  if (ss.getId() !== B365D5_CANONICAL_ID) throw new Error('B365D5_CANONICAL_MISMATCH');
  return ss;
}

function b365d5Today_() {
  return Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd');
}
function b365d5DateKey_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, 'Asia/Seoul', 'yyyy-MM-dd');
  var s=String(v==null?'':v).trim();
  var m=s.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/);
  if (m) return m[1]+'-'+('0'+m[2]).slice(-2)+'-'+('0'+m[3]).slice(-2);
  return s;
}

function b365d5Headers_() {
  return {
    q:['DATE','SLOT','QUEENS_ID','SOURCE_TYPE','PASSAGE_ID','BIBLE_REF','BIBLE_TEXT','SITUATION','THEME','USER_OR_MARKET_NEED','SOURCE_LINEAGE','RIGHTS','STATUS','UPDATED_AT'],
    s:['DATE','SLOT','SEED_ID','QUEENS_ID','PASSAGE_ID','BIBLE_REF','THEME','SITUATION','PERSONA_ID','PERSONA_NAME','LENSES','STORY_SEED','FRONT_USE','REUSE_PRIORITY','STATUS','UPDATED_AT'],
    t1:['DATE','SLOT','T1_ID','SEED_ID','PASSAGE_ID','BIBLE_REF','BIBLE_TEXT','PERSONA_ID','PERSONA_NAME','SITUATION','STORYBOARD','LENSES','HOOK','EMPATHY','PRINCIPLE','ACTION_24H','QUESTION','STATUS'],
    t2:['DATE','SLOT','T2_ID','T1_ID','SEED_ID','BIBLE_REF','PERSONA_ID','FRONT_LONG','YOUTUBE_SCRIPT','BLOG_NEWSLETTER','SHORT_SOCIAL','AUDIO_TEXT','TAGS','FRONT_ROUTE','PUBLISH_ROUTE','QA_FLAGS','STATUS','UPDATED_AT'],
    f:['DATE','SLOT','PACKAGE_ID','T2_ID','BIBLE_REF','BIBLE_TEXT','TITLE','BODY','PERSONA_ID','PERSONA_NAME','YOUTUBE_SCRIPT','SHORT_SOCIAL','AUDIO_TEXT','TAGS','READY_YN','RUNTIME_STATE','SOURCE_LINEAGE','UPDATED_AT'],
    r:['RUN_AT','RUN_ID','STAGE','STATUS','DETAIL','INPUT_COUNT','OUTPUT_COUNT','TEMPLATE_ID','TRIGGER_STATE','NEXT_ACTION']
  };
}
function b365d5Sheet_(name, headers) {
  var sh = b365d5SS_().getSheetByName(name);
  if (!sh) throw new Error('B365D5_SHEET_MISSING:' + name);
  var got = sh.getRange(1,1,1,headers.length).getValues()[0].map(String);
  for (var i=0;i<headers.length;i++) {
    if (got[i] !== headers[i]) throw new Error('B365D5_HEADER_MISMATCH:' + name + ':' + headers[i]);
  }
  return sh;
}

function b365d5Map_(headers) {
  var m={}; headers.forEach(function(h,i){m[h]=i;}); return m;
}

function b365d5RowObject_(headers, row) {
  var o={}; headers.forEach(function(h,i){o[h]=row[i];}); return o;
}

function b365d5Upsert_(sh, headers, key, data) {
  var m=b365d5Map_(headers), last=sh.getLastRow(), target=0;
  if (last>1) {
    var vals=sh.getRange(2,1,last-1,headers.length).getValues();
    for (var i=0;i<vals.length;i++) {
      if (b365d5DateKey_(vals[i][m.DATE])===b365d5DateKey_(key.DATE) && Number(vals[i][m.SLOT])===Number(key.SLOT)) {target=i+2;break;}
    }
  }
  var row=headers.map(function(h){return data[h] == null ? '' : data[h];});
  if (target) sh.getRange(target,1,1,headers.length).setValues([row]);
  else sh.appendRow(row);
  return target || sh.getLastRow();
}
function b365d5Passages_(today) {
  var ss=b365d5SS_(), sh=ss.getSheetByName('Bible_Passage_Library_V2') || ss.getSheetByName('Bible_Passage_Library');
  if (!sh || sh.getLastRow()<6) throw new Error('B365D5_PASSAGE_LIBRARY_EMPTY');
  var vals=sh.getDataRange().getValues(), headers=vals[0].map(String), m=b365d5Map_(headers), rows=[];
  for (var i=1;i<vals.length;i++) {
    var r=b365d5RowObject_(headers,vals[i]);
    var active=String(r.ACTIVE||'Y').toUpperCase();
    var status=String(r.LIB_STATUS||'APPROVED').toUpperCase();
    var ref=String(r.REF_DISPLAY||r.REF_RANGE||r.REPRESENTATIVE_REF||'').trim();
    var text=String(r.TEXT_DISPLAY||r.TEXT_FULL||'').trim();
    if (active==='Y' && (status==='' || status==='APPROVED') && ref && text) rows.push(r);
  }
  if (rows.length<5) throw new Error('B365D5_APPROVED_PASSAGES_LT5:' + rows.length);
  var seed=Number(String(today).replace(/-/g,'')), start=seed % rows.length, out=[];
  for (var n=0;n<5;n++) out.push(rows[(start+n)%rows.length]);
  return out;
}

function b365d5Persona_(slot) {
  var a=[
    ['PERSONA_LISTEN','경청형','본(本)·믿음과 사랑 / 권위의 근거'],
    ['PERSONA_REALITY','현실점검형','말씀 학습·행동 / 은사'],
    ['PERSONA_RELATION','관계회복형','일관성 / 인과관계'],
    ['PERSONA_ACTION','실천동행형','진보 / 경건'],
    ['PERSONA_GROWTH','배움성장형','은사 / 주님의 뜻 / 섬김']
  ];
  return a[(Number(slot)-1)%a.length];
}
function b365d5Copy_(slot, p) {
  var ref=String(p.REF_DISPLAY||p.REF_RANGE||p.REPRESENTATIVE_REF||'').trim();
  var text=String(p.TEXT_DISPLAY||p.TEXT_FULL||'').trim();
  var theme=String(p.CORE_THEMES||'말씀,믿음,생활').replace(/,/g,' · ');
  var per=b365d5Persona_(slot), pname=per[1];
  var situation, hook, empathy, principle, action, question;
  if (slot===1) {
    situation='말씀을 읽었지만 오늘 삶에서 무엇으로 보여야 할지 막막할 때';
    hook='말씀을 안다는 것과 오늘 그대로 살아내는 것은 어떻게 연결될까?';
    empathy='마음으로 동의한 말씀도 바쁜 하루 속에서는 행동으로 이어지지 않을 수 있다.';
    principle='본문을 먼저 듣고, 믿음이 사랑과 실제 행동으로 이어지는지 점검한다.';
    action='오늘 본문에서 한 문장을 골라 한 가지 행동으로 옮긴다.';
    question='오늘 내 믿음은 누구에게 어떤 사랑의 행동으로 보일 수 있는가?';
  } else if (slot===2) {
    situation='말씀을 알고도 현실의 선택 앞에서 내 생각이 먼저 앞설 때';
    hook='지금의 선택에서 말씀보다 먼저 움직이는 것은 무엇일까?';
    empathy='사실과 감정과 욕심이 섞이면 익숙한 판단을 말씀의 뜻으로 착각하기 쉽다.';
    principle='배운 말씀을 행동에 연결하기 위해 사실·감정·욕심을 나누어 보고 본문 기준을 다시 확인한다.';
    action='오늘 결정 하나를 세 칸으로 나눠 적고 본문에 비추어 다시 선택한다.';
    question='내가 내려놓아야 할 자기중심적 판단은 무엇인가?';
  } else if (slot===3) {
    situation='가족이나 사회 관계에서 옳은 말을 했지만 신뢰가 함께 따라오지 않을 때';
    hook='내 말과 행동은 같은 기준을 향하고 있는가?';
    empathy='옳은 말도 내 행동과 다르면 상대에게는 기준이 아니라 부담으로 들릴 수 있다.';
    principle='본문의 기준을 상대에게만 적용하지 않고 나에게도 적용해 겉과 속, 말과 행동의 일관성을 세운다.';
    action='오늘 한 사람에게 먼저 경청·도움·사과 중 필요한 한 가지를 실행한다.';
    question='내 관계에서 말보다 행동으로 증명해야 할 것은 무엇인가?';
  } else if (slot===4) {
    situation='세상 일과 반복되는 어려움 때문에 신앙의 진보가 보이지 않는다고 느낄 때';
    hook='성장은 큰 결심보다 어떤 작은 순종을 반복하는가에서 보이지 않을까?';
    empathy='결과가 늦으면 멈추고 싶지만 인내가 필요한 구간에서 작은 행동이 신앙의 방향을 지킨다.';
    principle='본문을 오늘의 선택에 연결하고, 지식·감정·의지를 한 방향으로 모아 작은 순종을 반복한다.';
    action='미루던 선한 일 하나를 10분 시작하고 끝에 배운 점 한 줄을 기록한다.';
    question='오늘 인내로 남길 수 있는 작은 진보는 무엇인가?';
  } else {
    situation='배운 말씀과 받은 능력을 나만 아는 것으로 끝내지 않고 사람을 세우는 데 쓰고 싶을 때';
    hook='배운 말씀은 누구를 세우고 섬길 때 더 분명해질까?';
    empathy='가르치려는 마음이 앞서면 상대를 놓칠 수 있고, 섬김만 하다 기준을 잃으면 방향도 흐려질 수 있다.';
    principle='본문을 기반으로 먼저 배우고 행동한 뒤, 받은 은사를 사랑 안에서 설명하고 섬기는 데 사용한다.';
    action='오늘 한 사람에게 본문에서 배운 한 가지를 짧게 나누고 그 사람의 이야기도 듣는다.';
    question='나는 오늘 누구를 가르치기 전에 무엇을 배우고 어떻게 섬길 것인가?';
  }
  return {ref:ref,text:text,theme:theme,personaId:per[0],personaName:pname,lenses:per[2],situation:situation,hook:hook,empathy:empathy,principle:principle,action:action,question:question};
}
function runBible365Daily5PipelineTick() {
  var H=b365d5Headers_(), today=b365d5Today_(), runId='B365D5_'+today.replace(/-/g,'')+'_'+Utilities.formatDate(new Date(),'Asia/Seoul','HHmmss');
  var qsh=b365d5Sheet_('성경365_일일5_Queens',H.q), ssh=b365d5Sheet_('성경365_일일5_Seed',H.s);
  var t1sh=b365d5Sheet_('성경365_일일5_T1_Template',H.t1), t2sh=b365d5Sheet_('성경365_일일5_T2_Delivery',H.t2);
  var fsh=b365d5Sheet_('성경365_일일5_Front_Bridge',H.f), rsh=b365d5Sheet_('성경365_일일5_Run_Log',H.r);
  try {
    var dedupe=b365d5DedupeToday_(today);
    var pre=inspectBible365Daily5Runtime();
    pre.dedupe=dedupe;
    if (pre.dataOk) { pre.reused=true; pre.ok=(pre.triggerCount===1); return pre; }
    var passages=b365d5Passages_(today);
    for (var slot=1;slot<=5;slot++) {
      var p=passages[slot-1], c=b365d5Copy_(slot,p), pid=String(p.PASSAGE_ID||'P_RUNTIME_'+slot);
      var qid='Q_D5_'+today.replace(/-/g,'')+'_S'+slot;
      var sid='SEED_D5_'+today.replace(/-/g,'')+'_S'+slot;
      var t1id='T1_D5_'+today.replace(/-/g,'')+'_S'+slot;
      var t2id='T2_D5_'+today.replace(/-/g,'')+'_S'+slot;
      var pkg='PKG_D5_'+today.replace(/-/g,'')+'_S'+slot;
      var lineage='Bible_Passage_Library_V2>'+pid+'>Queens>Seed>T1>T2';
      b365d5Upsert_(qsh,H.q,{DATE:today,SLOT:slot},{DATE:today,SLOT:slot,QUEENS_ID:qid,SOURCE_TYPE:'BIBLE_PASSAGE_RUNTIME',PASSAGE_ID:pid,BIBLE_REF:c.ref,BIBLE_TEXT:c.text,SITUATION:c.situation,THEME:c.theme,USER_OR_MARKET_NEED:'매일 말씀 기반 5개 묵상 자동생산',SOURCE_LINEAGE:'Bible_Passage_Library_V2>'+pid,RIGHTS:'INTERNAL_VERIFIED_SOURCE',STATUS:'RUNTIME_QUEENS_READY',UPDATED_AT:new Date()});
      b365d5Upsert_(ssh,H.s,{DATE:today,SLOT:slot},{DATE:today,SLOT:slot,SEED_ID:sid,QUEENS_ID:qid,PASSAGE_ID:pid,BIBLE_REF:c.ref,THEME:c.theme,SITUATION:c.situation,PERSONA_ID:c.personaId,PERSONA_NAME:c.personaName,LENSES:c.lenses,STORY_SEED:'상황→본문문맥→8단계 렌즈→실천→질문',FRONT_USE:'FRONT_DAILY5',REUSE_PRIORITY:'HIGH',STATUS:'RUNTIME_SEED_READY',UPDATED_AT:new Date()});
      b365d5Upsert_(t1sh,H.t1,{DATE:today,SLOT:slot},{DATE:today,SLOT:slot,T1_ID:t1id,SEED_ID:sid,PASSAGE_ID:pid,BIBLE_REF:c.ref,BIBLE_TEXT:c.text,PERSONA_ID:c.personaId,PERSONA_NAME:c.personaName,SITUATION:c.situation,STORYBOARD:'DRYWRITER_BIBLE_DAILY5_STORYBOARD_V2_20260906|상황→본문→묵상→실천→질문',LENSES:c.lenses,HOOK:c.hook,EMPATHY:c.empathy,PRINCIPLE:c.principle,ACTION_24H:c.action,QUESTION:c.question,STATUS:'RUNTIME_T1_READY'});
      var frontLong=c.hook+' '+c.empathy+' '+c.principle+' 오늘의 실천: '+c.action+' 묵상 질문: '+c.question;
      var yt='[HOOK] '+c.hook+'\n[WORD] '+c.ref+'\n[TEXT] '+c.text+'\n[INSIGHT] '+c.principle+'\n[ACTION] '+c.action+'\n[QUESTION] '+c.question;
      var blog='## '+c.hook+' · '+c.ref+'\n'+c.text+'\n\n'+c.empathy+' '+c.principle+'\n\n**오늘의 실천** '+c.action+'\n\n**묵상 질문** '+c.question;
      var shortText=c.ref+' · '+c.principle+' '+c.action+' #성경365 #묵상';
      var audio=c.ref+'. '+c.text+' '+c.principle+' '+c.action;
      var tags='성경365,묵상,'+String(p.BOOK||'성경')+','+c.personaName;
      b365d5Upsert_(t2sh,H.t2,{DATE:today,SLOT:slot},{DATE:today,SLOT:slot,T2_ID:t2id,T1_ID:t1id,SEED_ID:sid,BIBLE_REF:c.ref,PERSONA_ID:c.personaId,FRONT_LONG:frontLong,YOUTUBE_SCRIPT:yt,BLOG_NEWSLETTER:blog,SHORT_SOCIAL:shortText,AUDIO_TEXT:audio,TAGS:tags,FRONT_ROUTE:'APP_BIBLE365',PUBLISH_ROUTE:'DRAFT_ONLY',QA_FLAGS:'SCRIPTURE_CONTEXT_REQUIRED,NO_CONDEMNATION_OR_OVERCLAIM,PRACTICAL_ACTION_PRESENT',STATUS:'RUNTIME_T2_READY',UPDATED_AT:new Date()});
      b365d5Upsert_(fsh,H.f,{DATE:today,SLOT:slot},{DATE:today,SLOT:slot,PACKAGE_ID:pkg,T2_ID:t2id,BIBLE_REF:c.ref,BIBLE_TEXT:c.text,TITLE:c.hook+' · '+c.ref,BODY:frontLong,PERSONA_ID:c.personaId,PERSONA_NAME:c.personaName,YOUTUBE_SCRIPT:yt,SHORT_SOCIAL:shortText,AUDIO_TEXT:audio,TAGS:tags,READY_YN:'Y',RUNTIME_STATE:'LIVE_READY',SOURCE_LINEAGE:lineage,UPDATED_AT:new Date()});
    }
    SpreadsheetApp.flush();
    var check=inspectBible365Daily5Runtime();
    if (!check.dataOk) throw new Error('B365D5_READBACK_FAIL:'+JSON.stringify(check));
    rsh.appendRow([new Date(),runId,'E2E_DAILY5','PASS','Queens→Seed→T1→T2→Front runtime 5개 readback PASS',5,5,B365D5_VERSION,'RUNTIME_EXECUTED','repeat tick once; verify idempotency and trigger=1']);
    check.runId=runId; check.ok=check.dataOk;
    return check;
  } catch(e) {
    try {rsh.appendRow([new Date(),runId,'E2E_DAILY5','FAIL',String(e&&e.stack||e),5,0,B365D5_VERSION,'RUNTIME_ERROR','fix cause and rerun']);} catch(ignore) {}
    throw e;
  }
}
function b365d5TodayRows_(sheetName, today) {
  var ss=b365d5SS_(), sh=ss.getSheetByName(sheetName);
  if (!sh || sh.getLastRow()<2) return [];
  var vals=sh.getDataRange().getValues(), headers=vals[0].map(String), m=b365d5Map_(headers), out=[];
  for (var i=1;i<vals.length;i++) if (b365d5DateKey_(vals[i][m.DATE])===today) out.push(b365d5RowObject_(headers,vals[i]));
  return out;
}

function b365d5DedupeToday_(today) {
  var names=['성경365_일일5_Queens','성경365_일일5_Seed','성경365_일일5_T1_Template','성경365_일일5_T2_Delivery','성경365_일일5_Front_Bridge'];
  var removed={};
  names.forEach(function(name){
    var sh=b365d5SS_().getSheetByName(name); removed[name]=0;
    if(!sh||sh.getLastRow()<2) return;
    var vals=sh.getDataRange().getValues(), headers=vals[0].map(String), m=b365d5Map_(headers), seen={}, del=[];
    for(var i=vals.length-1;i>=1;i--){
      if(b365d5DateKey_(vals[i][m.DATE])!==today) continue;
      var k=today+'|'+String(Number(vals[i][m.SLOT]));
      if(seen[k]) del.push(i+1); else seen[k]=true;
    }
    del.sort(function(a,b){return b-a;}).forEach(function(r){sh.deleteRow(r);});
    removed[name]=del.length;
  });
  SpreadsheetApp.flush();
  return removed;
}

function b365d5TriggerEvidence_() {
  return ScriptApp.getProjectTriggers().filter(function(t){return t.getHandlerFunction && t.getHandlerFunction()==='runBible365Daily5PipelineTick';}).map(function(t){
    return {handler:t.getHandlerFunction(),eventType:String(t.getEventType()),source:String(t.getTriggerSource()),uniqueId:t.getUniqueId()};
  });
}

function b365d5TriggerCount_() {
  return ScriptApp.getProjectTriggers().filter(function(t){return t.getHandlerFunction && t.getHandlerFunction()==='runBible365Daily5PipelineTick';}).length;
}

function inspectBible365Daily5Runtime() {
  var today=b365d5Today_();
  var q=b365d5TodayRows_('성경365_일일5_Queens',today), s=b365d5TodayRows_('성경365_일일5_Seed',today);
  var t1=b365d5TodayRows_('성경365_일일5_T1_Template',today), t2=b365d5TodayRows_('성경365_일일5_T2_Delivery',today);
  var f=b365d5TodayRows_('성경365_일일5_Front_Bridge',today);
  var ready=f.filter(function(x){return String(x.READY_YN).toUpperCase()==='Y' && String(x.RUNTIME_STATE)==='LIVE_READY';}).length;
  var slots={}; f.forEach(function(x){slots[String(x.SLOT)]=(slots[String(x.SLOT)]||0)+1;});
  var duplicateSlots=Object.keys(slots).filter(function(k){return slots[k]!==1;});
  var counts={Queens:q.length,Seed:s.length,T1:t1.length,T2:t2.length,Front:f.length,FrontReady:ready};
  var dataOk=q.length===5 && s.length===5 && t1.length===5 && t2.length===5 && f.length===5 && ready===5 && duplicateSlots.length===0;
  var triggerCount=b365d5TriggerCount_();
  return {ok:dataOk && triggerCount===1,dataOk:dataOk,today:today,counts:counts,duplicateSlots:duplicateSlots,triggerCount:triggerCount,triggerEvidence:b365d5TriggerEvidence_(),version:B365D5_VERSION};
}
function installOrReuseBible365Daily5Trigger() {
  var handler='runBible365Daily5PipelineTick';
  var arr=ScriptApp.getProjectTriggers().filter(function(t){return t.getHandlerFunction && t.getHandlerFunction()===handler;});
  for (var i=1;i<arr.length;i++) ScriptApp.deleteTrigger(arr[i]);
  if (!arr.length) ScriptApp.newTrigger(handler).timeBased().everyHours(2).create();
  var count=b365d5TriggerCount_();
  if (count!==1) throw new Error('B365D5_TRIGGER_COUNT_FAIL:'+count);
  return {ok:true,handler:handler,triggerCount:count,everyHours:2,intervalMinutes:120,version:B365D5_VERSION};
}

function removeBible365Daily5DuplicateTriggers() {
  var handler='runBible365Daily5PipelineTick', arr=ScriptApp.getProjectTriggers().filter(function(t){return t.getHandlerFunction && t.getHandlerFunction()===handler;});
  var removed=0; for(var i=1;i<arr.length;i++){ScriptApp.deleteTrigger(arr[i]);removed++;}
  return {ok:b365d5TriggerCount_()<=1,removed:removed,triggerCount:b365d5TriggerCount_()};
}

function runBible365Daily5RepairAndTest() {
  var trigger=installOrReuseBible365Daily5Trigger();
  var first=runBible365Daily5PipelineTick();
  var second=runBible365Daily5PipelineTick();
  var finalCheck=inspectBible365Daily5Runtime();
  if (!finalCheck.ok) throw new Error('B365D5_FINAL_VERIFY_FAIL:'+JSON.stringify(finalCheck));
  var H=b365d5Headers_(), rsh=b365d5Sheet_('성경365_일일5_Run_Log',H.r);
  rsh.appendRow([new Date(),'B365D5_REPAIR_X2_'+Utilities.formatDate(new Date(),'Asia/Seoul','yyyyMMdd_HHmmss'),'REPAIR_TEST_X2','PASS','날짜 정규화+중복정리+tick x2+Front READY 5+trigger 1 readback PASS',5,5,B365D5_VERSION,'TRIGGER_1_VERIFIED','central registry update + front readback x2']);
  return {ok:true,trigger:trigger,first:first,second:second,finalCheck:finalCheck};
}
