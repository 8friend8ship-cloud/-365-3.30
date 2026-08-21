import fs from 'node:fs';

const gateway = fs.readFileSync(new URL('../apps-script/Bible1_Unified_Delivery_Gateway_v20260820.gs', import.meta.url), 'utf8');
const t2Source = fs.readFileSync(new URL('../apps-script/Bible1_T2_Template_Pack_v20260821.gs', import.meta.url), 'utf8');

const requiredGatewayMarkers = [
  "PUBLIC_SHEET: '03_Public_Output'",
  'translationManifestUrl',
  'audioManifestUrl',
  'sourceDbMapId',
  "rightsStatus || 'UNVERIFIED'"
];
for (const marker of requiredGatewayMarkers) {
  if (!gateway.includes(marker)) throw new Error(`BIBLE365_GATEWAY_MARKER_MISSING:${marker}`);
}

const requiredT2Markers = [
  'BIBLE365_FRONT_PLATFORM_PACK_V2',
  'questionByLang',
  'actionByLang',
  'publicAudioAllowed',
  "status: 'WAITING_APPROVAL'",
  'CONTENT_READY_YN',
  'APP_READY_YN',
  'FRONT_EXPOSED_YN'
];
for (const marker of requiredT2Markers) {
  if (!t2Source.includes(marker)) throw new Error(`BIBLE365_T2_MARKER_MISSING:${marker}`);
}

const fixture = {
  PUBLIC_OUTPUT_ID: 'PUB_R16_20260709_3E6E50',
  CONTENT_ID: 'R16_20260709_3E6E50',
  CORE_ID: 'CORE_20260709_3E6E50',
  SOURCE_DB_MAP_ID: 'DBN_CD833712',
  TITLE: '사랑이라는 말이 부담이 되는 순간',
  SUMMARY: '검증용 본문 요약',
  BIBLE_REF: '빌립보서 1:9',
  BIBLE_TEXT: '내가 기도하노라',
  CONTENT_READY_YN: 'Y',
  APP_READY_YN: 'Y',
  FRONT_EXPOSED_YN: 'Y',
  TRANSLATION_READY_YN: 'N',
  AUDIO_READY_YN: 'N',
  PACKAGE_READY_YN: 'N'
};
if (!(fixture.CONTENT_READY_YN === 'Y' && fixture.APP_READY_YN === 'Y' && fixture.FRONT_EXPOSED_YN === 'Y')) throw new Error('BIBLE365_FIXTURE_FRONT_GATE_FAILED');
if (!fixture.TITLE || !fixture.SUMMARY || !fixture.BIBLE_REF || !fixture.BIBLE_TEXT) throw new Error('BIBLE365_FIXTURE_REQUIRED_FIELD_FAILED');

console.log(JSON.stringify({
  ok: true,
  contract: 'BIBLE1_UNIFIED_DELIVERY_V1',
  t2Contract: 'BIBLE365_FRONT_PLATFORM_PACK_V2',
  canonicalSheet: '03_Public_Output',
  contentKey: fixture.CONTENT_ID,
  rightsStatus: 'UNVERIFIED',
  publicAudioAllowed: false,
  publishStatus: 'WAITING_APPROVAL'
}));

