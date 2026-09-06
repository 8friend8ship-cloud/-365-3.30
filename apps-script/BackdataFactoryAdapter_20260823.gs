const BIBLE365_FACTORY_ADAPTER_VERSION='BIBLE365_FACTORY_ADAPTER_V1_20260823';
const BIBLE365_FACTORY_MASTER_ID='1C_CznU1Uo7dk-gKay3-oH8wFxutsGMlz27RSrbdVQwI';
const BIBLE365_FACTORY_APP_ID='APP_BIBLE365';
const BIBLE365_FACTORY_TARGET_ID='FPC_BIBLE365_20260823';

function runBible365BackdataFactoryControl10m(){return runBible365FactoryAdapter_(false);}
function checkBible365BackdataFactoryAdapter(){return runBible365FactoryAdapter_(true);}
function runBible365ApiAbQaControl(){return bible365FactoryApiWindow_();}

function runBible365FactoryAdapter_(healthOnly){
  const now=new Date(),props=PropertiesService.getScriptProperties(),bucket=Utilities.formatDate(now,'Asia/Seoul','yyyyMMddHHmm').slice(0,11),key='BIBLE365_FACTORY_BUCKET';
  if(!healthOnly&&props.getProperty(key)===bucket)return{ok:true,skipped:true,reason:'SAME_10M_BUCKET',bucket:bucket,version:BIBLE365_FACTORY_ADAPTER_VERSION};
  const lock=LockService.getScriptLock();if(!lock.tryLock(5000))return{ok:false,reason:'LOCK_BUSY'};
  try{
    const central=SpreadsheetApp.openById(BIBLE365_FACTORY_MASTER_ID),target=bible365FactoryTarget_(central),triggers=ScriptApp.getProjectTriggers().map(function(t){return t.getHandlerFunction();});
    const known=['runBible365BackdataPipeline','buildSeries365Daily','buildProverbs365TitleAudioDaily','buildProverbs365AudioDelivery'];
    const handlers=known.map(function(n){return{handler:n,present:typeof globalThis[n]==='function'};});
    const out={ok:true,appId:BIBLE365_FACTORY_APP_ID,target:target,handlers:handlers,existingTriggers:triggers,bucket:bucket,checkedAt:now.toISOString(),version:BIBLE365_FACTORY_ADAPTER_VERSION};
    bible365FactoryMark_(central,out);if(!healthOnly)props.setProperty(key,bucket);props.setProperty('BIBLE365_FACTORY_LAST_RESULT',JSON.stringify(out).slice(0,8000));return out;
  }finally{lock.releaseLock();}
}
function bible365FactoryApiWindow_(){const now=new Date(),hour=Number(Utilities.formatDate(now,'Asia/Seoul','H'));if([9,13,17,21].indexOf(hour)<0)return{ok:true,skipped:true,reason:'OUTSIDE_API_AB_WINDOW'};const props=PropertiesService.getScriptProperties(),key='BIBLE365_API_AB_'+Utilities.formatDate(now,'Asia/Seoul','yyyyMMdd')+'_'+hour;if(props.getProperty(key)==='Y')return{ok:true,skipped:true,reason:'WINDOW_ALREADY_RUN'};const out={ok:false,degraded:true,appId:BIBLE365_FACTORY_APP_ID,error:'API_EXECUTOR_NOT_MAPPED',decision:'API_MAY_VALIDATE_TREND_FORMAT_OR_VERIFIED_SCRIPTURE_GAP_ONLY_NEVER_OVERRIDE_RIGHTS',version:BIBLE365_FACTORY_ADAPTER_VERSION};bible365FactoryQa_(out,now);props.setProperty(key,'Y');return out;}
function bible365FactoryTarget_(central){const sh=central.getSheetByName('66_FACTORY_PRODUCTION_CONTROL');if(!sh||sh.getLastRow()<2)return{found:false};const rows=sh.getRange(2,1,sh.getLastRow()-1,26).getDisplayValues();for(let i=rows.length-1;i>=0;i--)if(String(rows[i][0])===BIBLE365_FACTORY_TARGET_ID)return{found:true,queens:Number(rows[i][5]||0),seed:Number(rows[i][6]||0),t1:Number(rows[i][7]||0),t2:Number(rows[i][8]||0),assets:Number(rows[i][9]||0),qualityGate:String(rows[i][18]||'')};return{found:false};}
function bible365FactoryMark_(central,out){const sh=central.getSheetByName('66_FACTORY_PRODUCTION_CONTROL');if(!sh||sh.getLastRow()<2)return;const rows=sh.getRange(2,1,sh.getLastRow()-1,26).getDisplayValues();for(let i=rows.length-1;i>=0;i--)if(String(rows[i][0])===BIBLE365_FACTORY_TARGET_ID){const present=out.handlers.filter(function(h){return h.present;}).map(function(h){return h.handler;});sh.getRange(i+2,25).setValue(present.length?'BIBLE365_ADAPTER_SOURCE_READY_RUNTIME_X2_REQUIRED':'BIBLE365_BOUND_HANDLER_MAPPING_REQUIRED');sh.getRange(i+2,26).setValue('LAST_ADAPTER='+out.checkedAt+';PRESENT='+present.join('|'));return;}}
function bible365FactoryQa_(out,now){const sh=SpreadsheetApp.openById(BIBLE365_FACTORY_MASTER_ID).getSheetByName('67_FACTORY_QA_AB_LOG');if(!sh)return;sh.appendRow(['QA_BIBLE365_'+Utilities.formatDate(now,'Asia/Seoul','yyyyMMdd_HH00'),Utilities.formatDate(now,'Asia/Seoul','yyyy-MM-dd HH:mm:ss')+' KST',BIBLE365_FACTORY_APP_ID,'DEVOTIONAL_FIXTURE_PENDING','OWN_LIBRARIAN_QUEENS_SEED_T1_T2','APPROVED_API_ON','','','','','','','','','','','','','',out.error,'','API_EXECUTOR_MAPPING_REQUIRED','BIBLE365_FACTORY_ADAPTER_V1','PENDING']);}
