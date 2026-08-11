/*
 * Bible4 V12 Auto E2E Fallback
 * 2026-08-10
 *
 * 목적:
 * - FRONT_LOCAL_PACK / FRONT_LOCAL_DEVICE_TTS 정책에서 서버 다국어 TTS 파일 없이도
 *   Content_Final -> Audio_Final(pointer/marker) -> App_Delivery_Final 체인을 완주한다.
 * - 이 파일은 V11 전체본에 병합할 V12 모듈이다.
 * - API key/token/secret을 요구하거나 저장하지 않는다.
 *
 * 의존 helper:
 * b4DailyTriggerSheetNames_, b4FindTodayRows_, getSheet_,
 * getProverbsAudioSheetHeaders_, getProverbsDeliverySheetHeaders_,
 * ensureSheetHeadersAddOnly_, safeStr_, buildVerseKey_, upsertRowByKey_
 */

var b4EnsureTodayFrontLocalAudioMarker_ = function(today) {
  var names = b4DailyTriggerSheetNames_();
  var existing = b4FindTodayRows_(names.audio, today);
  if (existing.rows.length) return { ok: true, created: false, count: existing.rows.length };

  var contentSet = b4FindTodayRows_(names.content, today);
  if (!contentSet.rows.length) throw new Error('BIBLE4_V12_CONTENT_MISSING_FOR_AUDIO: ' + today);
  var c = contentSet.rows[contentSet.rows.length - 1];
  var sh = getSheet_(names.audio);
  if (!sh) throw new Error('BIBLE4_V12_AUDIO_SHEET_MISSING');
  var headers = getProverbsAudioSheetHeaders_();
  ensureSheetHeadersAddOnly_(names.audio, headers);
  var contentKey = safeStr_(c.CONTENT_KEY || c.CONTENT_ID);
  if (!contentKey) throw new Error('BIBLE4_V12_CONTENT_KEY_MISSING');
  var verseKey = buildVerseKey_(safeStr_(c.BOOK_CODE), Number(c.CHAPTER)||0, Number(c.VERSE_FROM)||0, Number(c.VERSE_TO)||Number(c.VERSE_FROM)||0);
  var ko = {
    title:safeStr_(c.TITLE_KO), verseRef:safeStr_(c.VERSE_REF_KO), verseText:safeStr_(c.VERSE_TEXT_KO),
    topic:safeStr_(c.TOPIC_KO), body:safeStr_(c.BODY_KO), question:safeStr_(c.QUESTION_KO), action:safeStr_(c.ACTION_KO),
    audioText:safeStr_(c.AUDIO_TEXT_KO)||safeStr_(c.BODY_KO)
  };
  var data = {
    SERIES_ID:safeStr_(c.SERIES_ID), DATE_KEY:today, DATE_KEY_NORM:today, DAY_INDEX:Number(c.DAY_INDEX)||0,
    CONTENT_KEY:contentKey, VERSE_KEY:verseKey, VERSE_REF_KO:ko.verseRef, TITLE_KO:ko.title,
    MAP_ID:safeStr_(c.MAP_ID), VERSE_AXIS:safeStr_(c.VERSE_AXIS), FLOW_TYPE:safeStr_(c.FLOW_TYPE),
    LIFE_CONTEXT:safeStr_(c.LIFE_CONTEXT), CASE_ROLE:safeStr_(c.CASE_ROLE), AUDIO_TEXT_KO:ko.audioText,
    TAIL_TAG:'', LANGS:JSON.stringify(['KO']), AUDIO_READY_COUNT:0, AUDIO_TARGET_COUNT:0,
    AUDIO_FILE_IDS_JSON:'{}', AUDIO_URLS_JSON:'{}', AUDIO_WEBAPP_URLS_JSON:'{}', AUDIO_JSON_URLS_JSON:'{}',
    AUDIO_STATUS_JSON:JSON.stringify({mode:'FRONT_LOCAL_DEVICE_TTS',required:false,sourceReady:true}),
    AUDIO_FOLDER_PATHS_JSON:'{}', CONTENT_BY_LANG_JSON:JSON.stringify({KO:ko}),
    PAYLOAD_JSON:JSON.stringify({packageType:'BIBLE365_AUDIO_POINTER_V12',contentKey:contentKey,dateKey:today,localeMode:'FRONT_LOCAL_PACK',ttsMode:'FRONT_LOCAL_DEVICE',serverTts:false}),
    STATUS_KO:'SOURCE_READY', STATUS_EN:'FRONT_LOCAL', STATUS_JP:'FRONT_LOCAL', STATUS_CN:'FRONT_LOCAL',
    STATUS_ES:'FRONT_LOCAL', STATUS_DE:'FRONT_LOCAL', STATUS_HI:'FRONT_LOCAL', STATUS:'FRONT_LOCAL_TTS', UPDATED_AT:new Date()
  };
  upsertRowByKey_(sh, headers, 'CONTENT_KEY', contentKey, data);
  SpreadsheetApp.flush();
  var after = b4FindTodayRows_(names.audio, today);
  if (!after.rows.length) throw new Error('BIBLE4_V12_AUDIO_MARKER_WRITE_FAILED: ' + contentKey);
  return { ok:true, created:true, count:after.rows.length, contentId:contentKey };
};

var b4EnsureTodayFrontLocalDelivery_ = function(today) {
  var names = b4DailyTriggerSheetNames_();
  var existing = b4FindTodayRows_(names.delivery, today);
  if (existing.rows.length) return { ok:true, created:false, count:existing.rows.length };
  var contentSet = b4FindTodayRows_(names.content, today);
  if (!contentSet.rows.length) throw new Error('BIBLE4_V12_CONTENT_MISSING_FOR_DELIVERY: ' + today);
  var c = contentSet.rows[contentSet.rows.length - 1];
  var audioSet = b4FindTodayRows_(names.audio, today);
  if (!audioSet.rows.length) b4EnsureTodayFrontLocalAudioMarker_(today);
  var sh = getSheet_(names.delivery);
  if (!sh) throw new Error('BIBLE4_V12_DELIVERY_SHEET_MISSING');
  var headers = getProverbsDeliverySheetHeaders_();
  ensureSheetHeadersAddOnly_(names.delivery, headers);
  var contentKey = safeStr_(c.CONTENT_KEY || c.CONTENT_ID);
  var seriesId = safeStr_(c.SERIES_ID);
  var verseKey = buildVerseKey_(safeStr_(c.BOOK_CODE), Number(c.CHAPTER)||0, Number(c.VERSE_FROM)||0, Number(c.VERSE_TO)||Number(c.VERSE_FROM)||0);
  var packageId = [seriesId,today,verseKey||safeStr_(c.DAY_INDEX)].join('__');
  var ko = {title:safeStr_(c.TITLE_KO),verseRef:safeStr_(c.VERSE_REF_KO),verseText:safeStr_(c.VERSE_TEXT_KO),topic:safeStr_(c.TOPIC_KO),body:safeStr_(c.BODY_KO),question:safeStr_(c.QUESTION_KO),action:safeStr_(c.ACTION_KO),audioText:safeStr_(c.AUDIO_TEXT_KO)||safeStr_(c.BODY_KO)};
  var summary={status:'READY',packageId:packageId,contentKey:contentKey,seriesId:seriesId,localeMode:'FRONT_LOCAL_PACK',ttsMode:'FRONT_LOCAL_DEVICE',serverTranslation:false,serverTts:false};
  var payload={packageType:'BIBLE365_APP_DELIVERY_FRONT_LOCAL_V12',packageId:packageId,contentKey:contentKey,seriesId:seriesId,dateKey:today,dayIndex:Number(c.DAY_INDEX)||0,verseKey:verseKey,verseRefKo:ko.verseRef,titleKo:ko.title,status:'READY',canonicalLang:'KO',localeMode:'FRONT_LOCAL_PACK',ttsMode:'FRONT_LOCAL_DEVICE',contentByLang:{KO:ko},audioFileIds:{},audio:{},audioStatus:{mode:'FRONT_LOCAL_DEVICE_TTS',required:false,sourceReady:true}};
  var data={PACKAGE_ID:packageId,CONTENT_KEY:contentKey,SERIES_ID:seriesId,DATE_KEY:today,DATE_KEY_NORM:today,DAY_INDEX:Number(c.DAY_INDEX)||0,VERSE_KEY:verseKey,VERSE_REF_KO:ko.verseRef,TITLE_KO:ko.title,MAP_ID:safeStr_(c.MAP_ID),VERSE_AXIS:safeStr_(c.VERSE_AXIS),FLOW_TYPE:safeStr_(c.FLOW_TYPE),LIFE_CONTEXT:safeStr_(c.LIFE_CONTEXT),CASE_ROLE:safeStr_(c.CASE_ROLE),LANGS:JSON.stringify(['KO']),SUMMARY_JSON:JSON.stringify(summary),PAYLOAD_JSON:JSON.stringify(payload),STATUS:'READY',UPDATED_AT:new Date(),PRIMARY_AUDIO_FILE_ID:'',PRIMARY_AUDIO_URL:'',PRIMARY_AUDIO_WEBAPP_URL:'',AUDIO_JSON:'{}',AUDIO_FILE_IDS_JSON:'{}',AUDIO_URLS_JSON:'{}',AUDIO_WEBAPP_JSON:'{}',AUDIO_JSON_URLS_JSON:'{}',AUDIO_STATUS_JSON:JSON.stringify({mode:'FRONT_LOCAL_DEVICE_TTS',required:false,sourceReady:true}),CONTENT_BY_LANG_JSON:JSON.stringify({KO:ko}),STATUS_KO:'SOURCE_READY',STATUS_EN:'FRONT_LOCAL',STATUS_JP:'FRONT_LOCAL',STATUS_CN:'FRONT_LOCAL',STATUS_ES:'FRONT_LOCAL',STATUS_DE:'FRONT_LOCAL',STATUS_HI:'FRONT_LOCAL'};
  upsertRowByKey_(sh, headers, 'CONTENT_KEY', contentKey, data);
  SpreadsheetApp.flush();
  var after=b4FindTodayRows_(names.delivery,today);
  if (!after.rows.length) throw new Error('BIBLE4_V12_DELIVERY_WRITE_FAILED: '+contentKey);
  return {ok:true,created:true,count:after.rows.length,packageId:packageId,contentId:contentKey};
};

/*
 * V11 runBible4DailyFrontDelivery_ 안의 AUDIO/DELIVERY 단계에 다음 fallback을 병합한다.
 *
 * buildProverbs365TitleAudioDaily({ limit: 1, suppressAlert: true, onlyDateKey: today, reserveMs: 30000 });
 * if (b4CountTodayRows_(b4DailyTriggerSheetNames_().audio, today) < 1) b4EnsureTodayFrontLocalAudioMarker_(today);
 *
 * buildProverbs365AudioDelivery();
 * if (b4CountTodayRows_(b4DailyTriggerSheetNames_().delivery, today) < 1) b4EnsureTodayFrontLocalDelivery_(today);
 */
