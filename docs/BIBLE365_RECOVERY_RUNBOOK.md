# Bible365 R16 복구 실행서

## 현재 판정

- R16 본문 1~7장과 말씀 챕터 생성 기록은 존재한다.
- 중단 지점은 글 생성 전이 아니라 Drive JSON 저장 단계다.
- 반복 오류는 `saveJsonFile_`에서 null MIME type을 전달한 것이다.
- 프런트는 Apps Script 주소·시트 ID·접근값을 직접 참조하는 구형 연결 구조다.
- 자동 트리거는 실제 설치·성공 실행 증거가 확인되기 전까지 `TRIGGER_MISSING`으로 본다.

## 복구 순서

### 1. 비밀값 교체

1. 기존 접근 토큰을 폐기하고 새 값으로 교체한다.
2. 새 값은 Apps Script Properties와 Vercel Environment Variables에만 저장한다.
3. GitHub 소스와 Google Sheet 일반 셀에는 저장하지 않는다.

필수 서버 환경변수:

- `BIBLE365_GAS_WEBAPP_URL`
- `BIBLE365_ACCESS_TOKEN`

### 2. Apps Script JSON 저장 함수 교체

1. 메인 시트에 연결된 Apps Script 프로젝트를 연다.
2. `apps-script/R16_Runtime_Repair.gs`를 추가한다.
3. 기존 `saveJsonFile_` 함수의 본문을 아래 한 줄 호출 방식으로 교체한다.

```javascript
return r16SaveJsonFileSafe_(folderOrId, fileName, payload);
```

기존 함수의 실제 매개변수 이름은 유지하고 그 값들을 같은 순서로 넘긴다.
동일 이름의 `saveJsonFile_` 함수를 두 개 만들면 안 된다.

### 3. 독립 저장 테스트

Script Properties에 `R16_OUTPUT_FOLDER_ID`를 등록한 뒤 다음 함수를 수동 실행한다.

```javascript
testR16JsonSave_();
```

완료 기준:

- `.json` 파일이 실제 Drive 폴더에 생성됨
- MIME type이 `application/json`
- 파일 ID와 URL이 실행 로그에 표시됨
- null MIME type 오류가 재발하지 않음

### 4. 전체 파이프라인 1회 수동 검증

다음 순서가 같은 CONTENT_ID로 이어져야 한다.

1. QUEENS + ABCDE 입력
2. DB_Map_News READY
3. DryWriter_Auto_Input 생성
4. 하몬서클 1~7장 생성
5. 말씀 챕터 생성
6. 마스터 DOC와 JSON 저장
7. 최소 QA PASS
8. Public_Output 반영
9. Delivery_Output 반영
10. 프런트 today/latest 응답 확인

코드가 존재하거나 로그가 시작됐다는 이유만으로 완료 처리하지 않는다. 실제 파일, 출력행, API 응답, 프런트 표시 중 확인 가능한 증거가 있어야 한다.

### 5. 자동 트리거 설치

수동 검증이 성공한 뒤에만 실행한다.

```javascript
installR16AutomationTrigger();
```

설치 확인:

```javascript
inspectR16Automation();
```

완료 기준:

- handler가 `runR16Scheduled_`
- triggerCount가 정확히 1
- `lastSuccessAt`이 갱신됨
- `lastError`가 비어 있음
- 동일 시간대 중복 실행이 없음

### 6. 프런트 연결

현재 프런트의 직접 하드코딩은 제거하고 서버 환경변수 또는 중앙 계약표를 거쳐야 한다.

권장 구조:

```text
React 화면
  → Bible365 프록시/Apps Script 공개 읽기 API
  → 03_Public_Output 또는 정적 JSON
  → 본체 시트와 동일 CONTENT_ID
```

글 생성·관리 쓰기 기능은 공개 브라우저 토큰으로 실행하지 않는다. 관리자 쓰기 요청은 서버 측 비밀값 또는 별도 승인 흐름을 사용한다.

## 되돌리기

문제가 생기면 다음을 실행해 자동 실행만 멈춘다.

```javascript
pauseR16Automation();
```

원본 시트와 기존 산출물은 삭제하지 않는다.

## 최종 완료 조건

- JSON 저장 테스트 성공
- R16 전체 8챕터 수동 1회 성공
- Public_Output에 새 결과 존재
- Delivery_Output 또는 프런트용 정적 JSON 생성
- 프런트 today/latest에서 같은 CONTENT_ID 표시
- 자동 트리거 1개
- 다음 예약 실행의 `lastSuccessAt` 확인
