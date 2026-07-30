# OpenAI Project Control

- Repository: `8friend8ship-cloud/-365-3.30`
- Project role: **잠언365/성경365 풀스택 운영 앱 후보**
- Management status: `ACTIVE_PRIMARY_CANDIDATE`
- Last reviewed: `2026-07-30 KST`
- Architecture: React/Vite frontend + Express server + SQLite + Gemini + charts

## 1. 활용 방향

이 저장소는 잠언365·성경365의 **사용자용 프런트 앱과 서버 기능을 함께 제공하는 운영 후보본**으로 관리한다. 글을 새로 생산하는 본체가 아니라, DRYWRITE와 Drive 운영 시트에서 완성된 데이터를 받아 사용자에게 보여주고 AI 상담·검색·오디오·관리 기능을 제공하는 역할이 우선이다.

## 2. 상호 연계

### 상위 입력
- `DRYWRITE`: 기준 묵상글/R16 마스터
- `J365_WRITER_SHEET`: 작가 에이전트 결과
- `J365_MAIN_SHEET`: 잠언365/성경365 본문 및 상태
- `AUDIO_DELIVERY_SHEET`: 음원 송출 데이터

### 하위 출력
- 사용자 프런트 화면
- 관리자 대시보드
- 오디오 재생·외부 송출
- `Analyzer-12.09`로 전달할 사용·콘텐츠 성과 데이터
- 플랫폼 발행 에이전트 작업값

### 비교 대상
- `-365-AI-`: AI Studio 실험/대체 버전. 기능 중복과 최신 코드 차이를 비교한 뒤 운영본을 하나로 확정한다.

## 3. Drive 연계 정책

저장소에는 Drive URL·파일 ID를 직접 적지 않고 별칭만 사용한다.

- `MASTER_REGISTRY`
- `J365_MAIN_SHEET`
- `J365_WRITER_SHEET`
- `J365_PUBLISH_SHEET`
- `AUDIO_DELIVERY_SHEET`
- `MULTILINGUAL_AUDIO_SHEET`
- `WORKFLOW_CHARTER`

실제 연결값은 통합 기준 계정 `home design. taedi / homedesigntaedi@gmail.com`의 중앙 외부연결 운영대장에서 관리한다.

## 4. 파일 꼬리표

- `[FRONTEND]`: 사용자·관리자 화면
- `[SERVER]`: Express/API/서버 실행
- `[DB]`: SQLite·로컬 저장
- `[AI]`: Gemini 기능
- `[DRIVE]`: Sheets/Drive 데이터 송수신
- `[AUDIO]`: 오디오 URL·플레이어·송출
- `[I18N]`: 다국어 본문·UI
- `[DEPLOY]`: Vercel/Node 배포
- `[SECRET]`: 환경변수·키 점검
- `[LEGACY]`: 이전 임시 데이터·하드코딩
- `[REVIEW]`: 운영본 확정 전 비교 필요

## 5. 초기 파일 대장

| 파일/영역 | 태그 | 활용 방향 | 상태 | 다음 점검 |
|---|---|---|---|---|
| `server.ts` | `[SERVER] [DRIVE] [AUDIO]` | API, 오디오 전달, 외부 데이터 연결 | 우선 검토 | 배포 환경·Apps Script URL·오류 처리 확인 |
| `App.tsx` | `[FRONTEND] [INTEGRATION]` | 사용자 앱 진입점과 주요 기능 연결 | 우선 검토 | 저장 데이터 우선 사용 원칙 확인 |
| `package.json` | `[DEPLOY] [DB]` | Express·SQLite·Gemini·차트 의존성 | 확인됨 | Node/Vercel 호환성과 빌드 점검 |
| AI Lab 영역 | `[AI] [SECRET]` | 상담·검색·생성 기능 | 검토 예정 | 무료 호출/저장값 우선·비용 통제 확인 |
| Admin Dashboard | `[FRONTEND] [DB]` | 운영 상태·히스토리·관리 | 검토 예정 | 중앙 Agent 시트와 역할 중복 확인 |
| 오디오 컴포넌트 | `[AUDIO] [DRIVE]` | 저장 음원 재생 | 검토 예정 | `audio_full` 우선과 MIME/URL 안정성 확인 |
| i18n 데이터 | `[I18N]` | 다국어 본문·상황·UI | 검토 예정 | 7개국 데이터 키와 2번 시트 일치 확인 |

## 6. 수정 진행 규칙

1. 프런트 정상화 → 영상 단계 성공 → 앱 송호출 연결 순서를 지킨다.
2. 본문 글 생성 엔진을 이 저장소에 중복 구현하지 않는다.
3. 운영 데이터는 Drive 별칭을 통해 읽고, 하드코딩 데이터는 임시/레거시로 표시한다.
4. 코드 변경은 작업 브랜치와 Draft PR을 기본으로 한다.
5. API 키·Secret·서비스 계정 JSON은 저장소에 저장하지 않는다.
6. `-365-AI-`와 기능 비교 없이 동일 기능을 양쪽에서 동시에 수정하지 않는다.
7. 변경 후 프런트→서버→Drive/Audio→관리자 흐름을 통합 점검한다.

## 7. 결정 기록

- `2026-07-30`: 이 저장소를 풀스택 운영 후보로 분류하고 `-365-AI-`와 비교 관리 시작.
