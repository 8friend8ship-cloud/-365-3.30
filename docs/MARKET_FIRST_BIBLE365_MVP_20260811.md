# Bible365 Market-First MVP v1.0

Date: 2026-08-11 KST
Status: FRONT_REQUIREMENTS_FIRST

## Product order
1. Market/marketing evidence
2. Front user requirements and UX
3. Queens automated research collection
4. Seed v1 structured material
5. GitHub front template transformation and test
6. Apps Script backend functions/triggers
7. End-to-end verification
8. Vercel preview
9. Production domain assignment after approval

## Current market evidence
- YouVersion emphasizes daily rhythm, read/listen, plans, community, and analytics.
- Chowon combines Korean Bible, audio, QT/devotional, and AI commentary.
- Bible Chat emphasizes personalized daily plans and lock-screen scripture.
- Dwell differentiates on immersive/personalized audio.

The working product hypothesis is therefore: Bible365 should win first on a frictionless daily habit loop, strong Korean devotional packaging, reliable audio, and simple reflection/save/share flows rather than exposing admin or AI-generation controls to customers.

## Customer MVP
- Today: one primary daily package.
- Read: title, situation, scripture, main reflection, final question.
- Listen: audio_full or approved device-local playback fallback.
- KO-first runtime language switching.
- Local completion/streak state for MVP.
- Local bookmark/reflection state for MVP.
- Shareable content/deep-link payload.
- Recent archive.
- Explicit stale/fallback state; never fake current success.

## Exclude from customer surface
- AI Lab
- admin dashboard
- engine/debug controls
- direct voice generation
- Spreadsheet/editor/token exposure
- direct browser AI calls

## Marketing measurement
Track expected vs actual: Today open, read start, completion, audio play, next-day return, save/share, fallback/error, language switch.
Event schema: EVENT_ID, APP_ID, SESSION_ID, EVENT_NAME, CONTENT_ID, SOURCE_ID, SEED_ID, LOCALE, PLATFORM, CREATED_AT, APP_VERSION.
Do not send private reflection content.

## Queens contract
Queens automatically collects public market/content signals into Sheets. It does not write final devotional copy.
Fields: SOURCE_ID, SOURCE_TYPE, URL, PLATFORM, TOPIC, USER_NEED, FORMAT_PATTERN, HOOK_PATTERN, AUDIO_PATTERN, RETENTION_PATTERN, CTA_PATTERN, LANGUAGE, EVIDENCE_SUMMARY, VERIFIED_STATUS, FIRST_SEEN_AT, LAST_CHECKED_AT.

## Seed v1 contract
Approved Queens rows become first structured input material.
Fields: SEED_ID, SOURCE_IDS, PERSONA_NEED, SITUATION, CONFLICT, EMOTION, SCRIPTURE_SCOPE, CORE_QUESTION, HOOK, STORY_FLOW, AUDIO_DIRECTION, UI_SLOT, MARKETING_HYPOTHESIS, APPROVAL_STATUS, VERSION.
Seed is input, not published copy.

## GitHub template responsibility
GitHub owns deterministic validation/composition: schema validation, customer/admin separation, cache, i18n, accessibility, API contract, analytics events, build/type/security/bundle tests, preview artifact.
GitHub must not claim Apps Script trigger, Drive persistence, audio generation, or platform publishing success without runtime RESULT_ID/AUDIT_ID.

## Backend after front freeze
Apps Script functions are derived from verified front needs.
Minimum read path: getDailyPackage(date, locale), getRecentPackages(limit, locale), reportFrontReceipt(contentId, appVersion, status).
Generation remains separate: Queens -> approved Seed -> Writer -> Content Final -> Audio -> Delivery -> Front package.

## Release gates
FRONT_REQUIREMENTS_VERIFIED -> QUEENS_RUNTIME_VERIFIED -> SEED_CONTRACT_VERIFIED -> GITHUB_TEMPLATE_VERIFIED -> APPS_SCRIPT_E2E_VERIFIED_X2 -> VERCEL_PREVIEW_VERIFIED_X2 -> DOMAIN_APPROVAL -> PRODUCTION.
