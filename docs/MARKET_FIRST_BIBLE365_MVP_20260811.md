# Bible365 Market-First MVP v1.0

Date: 2026-08-11 KST
Status: FRONT_REQUIREMENTS_FIRST

## 1. Product order
1. Market/marketing evidence
2. Front user requirements and UX
3. Queens automated research collection
4. Seed v1 structured material
5. GitHub front template transformation and test
6. Apps Script backend functions/triggers
7. End-to-end front/backend verification
8. Vercel preview
9. Production domain assignment after approval

## 2. Market-backed core user jobs
Bible365 is a daily-use devotional product, not an admin/debug console.
Primary jobs:
- Open and understand today's message in under 30 seconds.
- Read or listen immediately.
- Continue a daily habit with minimal friction.
- Save/reflect/share when useful.
- Return tomorrow through reminder/progress context.

## 3. MVP front requirements
P0 customer surface:
- Today: one primary daily package card.
- Read: title, situation, scripture reference/text, main reflection, final question.
- Listen: audio_full or approved front-local playback fallback.
- Language: KO first with runtime language switching.
- Progress: local daily completion/streak state; no server write required for MVP.
- Save: local bookmark/reflection state for MVP.
- Share: shareable title/scripture/deep-link payload; publishing is separate.
- Archive: latest/recent packages, bounded list.
- Failure UX: cached last-good package with explicit stale label; never fake current success.

P0 excluded from customer surface:
- AI Lab
- Admin dashboard
- engine health/debug controls
- direct voice generation
- Spreadsheet ID/editor ID/token exposure
- direct browser Gemini/AI calls

These may remain in a separately gated internal/admin route.

## 4. Marketing measurement requirements
Before release, define expected vs actual for:
- landing -> Today open
- Today open -> read start
- read start -> completion
- Today open -> audio play
- completion -> next-day return
- save/share rate
- error/fallback rate
- language switch rate

Minimum event schema:
EVENT_ID, APP_ID, SESSION_ID(local/randomized), EVENT_NAME, CONTENT_ID, SOURCE_ID, SEED_ID, LOCALE, PLATFORM, CREATED_AT, APP_VERSION.
No sensitive devotional text or private reflection content in analytics events.

## 5. Queens contract
Queens collects public source signals automatically into Sheets.
It does not write the final devotional.
Required outputs:
SOURCE_ID, SOURCE_TYPE, URL, PLATFORM, TOPIC, USER_NEED, FORMAT_PATTERN, HOOK_PATTERN, AUDIO_PATTERN, RETENTION_PATTERN, CTA_PATTERN, LANGUAGE, EVIDENCE_SUMMARY, VERIFIED_STATUS, FIRST_SEEN_AT, LAST_CHECKED_AT.

## 6. Seed v1 contract
Seed is the first structured material created from approved Queens rows.
Required outputs:
SEED_ID, SOURCE_IDS[], PERSONA_NEED, SITUATION, CONFLICT, EMOTION, SCRIPTURE_SCOPE, CORE_QUESTION, HOOK, STORY_FLOW, AUDIO_DIRECTION, UI_SLOT, MARKETING_HYPOTHESIS, APPROVAL_STATUS, VERSION.
Seed is input material; it is not the published front copy.

## 7. GitHub template responsibility
GitHub receives approved Seed + front contract and can own deterministic work through:
- schema validation
- front composition
- local/cache behavior
- i18n UI packs
- accessibility
- customer/admin route separation
- API client contract
- event instrumentation
- build/type/security/bundle tests
- preview-ready artifact

GitHub must not claim success for:
- Apps Script trigger execution
- Drive/Sheet runtime persistence
- audio generation completion
- platform publishing completion
unless corresponding runtime RESULT_ID/AUDIT_ID is supplied.

## 8. Backend contract after front freeze
Apps Script functions must be derived from front needs, not the reverse.
Minimum read path:
getDailyPackage(date, locale) -> DAILY_PACKAGE_V1
getRecentPackages(limit, locale) -> DAILY_ARCHIVE_V1
reportFrontReceipt(contentId, appVersion, status) -> FRONT_RECEIPT_V1

Production generation path is separate:
Queens -> approved Seed -> Writer -> Content Final -> Audio -> Delivery -> Front package.

## 9. Release gates
FRONT_REQUIREMENTS_VERIFIED -> QUEENS_RUNTIME_VERIFIED -> SEED_CONTRACT_VERIFIED -> GITHUB_TEMPLATE_VERIFIED -> APPS_SCRIPT_E2E_VERIFIED_X2 -> VERCEL_PREVIEW_VERIFIED_X2 -> DOMAIN_APPROVAL -> PRODUCTION.

No domain is attached before preview verification and explicit domain choice.
