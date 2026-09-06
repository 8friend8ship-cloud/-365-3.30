/**
 * Bible365 QUEENS -> ABCDE/ABIDE bridge
 * Version: 2026-08-07
 *
 * 목적
 * - Queens_Source의 MAPPED_READY 씨드를 ABIDE_Code_Map으로 자동 변환한다.
 * - 같은 SOURCE_ID의 중복 ABIDE를 만들지 않는다.
 * - DB_Map_News의 ABIDE_ID를 같은 SOURCE_ID 기준으로 채운다.
 * - 기본 모드는 외부 AI 호출이 없는 ZERO_COST 규칙 기반이다.
 */

const B365_ABCDE_MAIN_SHEET_ID = '1HK4ATRZ-lSZ4fyuZi4ypHodgGZK1kBMsEFkAxOm9904';
const B365_ABCDE_SOURCE_SHEET = 'Queens_Source';
const B365_ABCDE_MAP_SHEET = 'ABIDE_Code_Map';
const B365_ABCDE_DBMAP_SHEET = 'DB_Map_News';

function bible365BuildABCDEFromQueens() {
  const ss = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('BIBLE365_MAIN_SPREADSHEET_ID') || B365_ABCDE_MAIN_SHEET_ID);
  const sourceSheet = ss.getSheetByName(B365_ABCDE_SOURCE_SHEET);
  const abideSheet = ss.getSheetByName(B365_ABCDE_MAP_SHEET);
  const dbMapSheet = ss.getSheetByName(B365_ABCDE_DBMAP_SHEET);
  if (!sourceSheet || !abideSheet || !dbMapSheet) throw new Error('B365_ABCDE_REQUIRED_SHEET_MISSING');
  const sources = sourceSheet.getDataRange().getValues();
  const abide = abideSheet.getDataRange().getValues();
  const sourceHeader = headerIndex_(sources[0]);
  const abideHeader = headerIndex_(abide[0]);
  const existingBySource = new Map();
  for (let r = 1; r < abide.length; r++) {
    const sourceId = str_(abide[r][abideHeader.SOURCE_ID]);
    const abideId = str_(abide[r][abideHeader.ABIDE_ID]);
    if (sourceId && abideId) existingBySource.set(sourceId, abideId);
  }
  const newRows = [];
  const generated = [];
  for (let r = 1; r < sources.length; r++) {
    const row = sources[r];
    const sourceId = str_(row[sourceHeader.SOURCE_ID]);
    const status = str_(row[sourceHeader.STATUS]);
    if (!sourceId || status !== 'MAPPED_READY' || existingBySource.has(sourceId)) continue;
    const theme = str_(row[sourceHeader.EXTRACTED_THEME]);
    const conflict = str_(row[sourceHeader.CONFLICT]);
    const scene = str_(row[sourceHeader.SCENE]);
    const emotion = str_(row[sourceHeader.EMOTION]);
    const hook = str_(row[sourceHeader.HOOK_STRUCTURE]);
    const abideId = `ABIDE_AUTO_${Utilities.getUuid().slice(0, 8).toUpperCase()}`;
    const mapped = {ABIDE_ID:abideId,SOURCE_ID:sourceId,A_CODE:`핵심 믿음·압박: ${theme || '현재 주제'}에서 ${conflict || '내적 갈등이 생긴다'}`,B_CODE:`반복 행동·반응: ${scene || '갈등 장면에서 익숙한 반응을 반복한다'}`,C_CODE:`숨은 비용: ${emotion || '긴장'}이 누적되어 관계와 회복의 비용이 커진다`,D_CODE:'관성·고착: 문제를 알아도 기존 해석과 반응을 유지해 같은 갈등을 반복한다',E_CODE:`선택의 대가: ${hook || '다음 선택에서 얻는 것과 잃는 것을 함께 본다'}`,ABIDE_KEY:`AUTOABCDE|${sourceId}`,STATUS:'AUTO_READY',CREATED_AT:new Date()};
    newRows.push(abide[0].map(h => mapped[h] !== undefined ? mapped[h] : ''));
    generated.push({ sourceId, abideId });
    existingBySource.set(sourceId, abideId);
  }
  if (newRows.length) abideSheet.getRange(abideSheet.getLastRow() + 1, 1, newRows.length, newRows[0].length).setValues(newRows);
  const linked = linkABCDEIntoDbMap_(dbMapSheet, existingBySource);
  const result = {ok:true,generatedCount:generated.length,linkedDbMapCount:linked,generated,mode:'ZERO_COST_RULES',at:new Date().toISOString()};
  console.log(JSON.stringify(result, null, 2));
  return result;
}

function linkABCDEIntoDbMap_(sheet, existingBySource) {
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return 0;
  const idx = headerIndex_(values[0]);
  if (idx.SOURCE_ID === undefined || idx.ABIDE_ID === undefined) throw new Error('B365_ABCDE_DBMAP_COLUMNS_MISSING');
  let changed = 0;
  for (let r = 1; r < values.length; r++) {
    const sourceId = str_(values[r][idx.SOURCE_ID]);
    const current = str_(values[r][idx.ABIDE_ID]);
    const abideId = existingBySource.get(sourceId);
    if (sourceId && !current && abideId) { sheet.getRange(r + 1, idx.ABIDE_ID + 1).setValue(abideId); changed++; }
  }
  return changed;
}

function inspectBible365ABCDEBridge() {
  const ss = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('BIBLE365_MAIN_SPREADSHEET_ID') || B365_ABCDE_MAIN_SHEET_ID);
  const sourceSheet = ss.getSheetByName(B365_ABCDE_SOURCE_SHEET);
  const abideSheet = ss.getSheetByName(B365_ABCDE_MAP_SHEET);
  const dbMapSheet = ss.getSheetByName(B365_ABCDE_DBMAP_SHEET);
  const sources = sourceSheet.getDataRange().getValues();
  const abide = abideSheet.getDataRange().getValues();
  const db = dbMapSheet.getDataRange().getValues();
  const sIdx = headerIndex_(sources[0]);
  const aIdx = headerIndex_(abide[0]);
  const dIdx = headerIndex_(db[0]);
  const mappedReady = sources.slice(1).filter(r => str_(r[sIdx.STATUS]) === 'MAPPED_READY').length;
  const autoAbide = abide.slice(1).filter(r => /^ABIDE_AUTO_/.test(str_(r[aIdx.ABIDE_ID]))).length;
  const readyDb = db.slice(1).filter(r => str_(r[dIdx.STATUS]) === 'READY').length;
  const readyDbWithAbide = db.slice(1).filter(r => str_(r[dIdx.STATUS]) === 'READY' && Boolean(str_(r[dIdx.ABIDE_ID]))).length;
  const result = { mappedReady, autoAbide, readyDb, readyDbWithAbide };
  console.log(JSON.stringify(result, null, 2));
  return result;
}
function headerIndex_(header){const idx={};header.forEach((name,i)=>{idx[String(name||'').trim()]=i;});return idx;}
function str_(value){return value==null?'':String(value).trim();}
