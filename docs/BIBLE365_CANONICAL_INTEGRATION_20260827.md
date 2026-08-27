# Bible365 Canonical Integration — 2026-08-27

## Canonical lock
- APP_ID: `APP_BIBLE365`
- CANONICAL_GROUP: `BIBLE365`
- Canonical GitHub: `8friend8ship-cloud/-365-3.30` / `main`
- Legacy complement: `8friend8ship-cloud/-365-AI-` — archive/read-only only after unique-feature diff.
- Never choose a version only because it is newer. Preserve proven strengths from historical/current versions.

## Version-union sources absorbed into the integration branch
- PR #1: R16 JSON MIME/runtime repair and ZERO_COST Queens→ABIDE bridge.
- PR #2: browser security/performance, lazy loading, cache/i18n/audio/admin/delivery UI strengths.
- PR #3: FRONT_LOCAL_DEVICE_TTS / FRONT_LOCAL_PACK Audio→Delivery fallback.
- PR #4: market-first customer requirements, Today/Read/Listen/habit/save/share/archive/failure UX, measurement and release gates.
- PR #5: Bible1 unified backend, `03_Public_Output`, T2 pack and delivery gateway.
- PR #6: reverse-requirement continuous backdata factory, quality/rights/API A/B policy.
- PR #7: same-origin server gateway, canonical security/runtime guards and central-agent governance.

## Product/front contract
The customer surface is a daily devotional product, not an admin/debug console.
P0: Today primary package; read title/situation/scripture/reflection/question; listen via approved audio or device-local fallback; KO-first language switching; local completion/streak and bookmark/reflection; share payload; recent archive; explicit stale/fallback state.
AI Lab, admin/debug controls, direct voice generation, private ids/tokens and direct browser AI calls are excluded from the normal customer surface.

## Single runtime lineage
`Front -> same-origin /api/bible365/* server gateway -> existing Bible1 canonical Apps Script -> canonical Sheet -> Bible_Verses/Library -> Queens -> Seed -> T1 -> translation/audio -> T2/App_Delivery_Final -> Front -> readback/QA`

Legacy J365 audio/publisher and Bible3 delivery sheets remain migration/read-only evidence sources. Do not install new triggers on them.

## Central-agent inherited rules
1. HISTORY_FIRST / PRE_CHECK before edits.
2. Reuse existing OAuth, clasp, Script ID, Deployment ID and trigger lineage unless actual expiry/change/failure evidence exists.
3. No new Apps Script project/deployment as a workaround.
4. Code/CI/trigger/URL existence is not runtime verification.
5. Completion requires workflow run + result readback + regression check + same-fixture retest + lesson check.
6. Same failure twice without new evidence -> DIAGNOSTIC_HOLD -> ROOT_CAUSE -> minimum fix -> same-fixture retest.
7. Front must not contain secrets, private deployment URLs, real Spreadsheet IDs or editor IDs.
8. Preserve stored/backdata results first. Do not silently label mock/fallback as LIVE.
9. Queens -> Seed -> T1 -> T2 lineage remains traceable by IDs/evidence.
10. Test outputs require purpose-fit audit and useful rules are written back to Seed/Template/Lesson history.

## Webapp connection policy
Browser traffic terminates only at same-origin `/api/bible365/*` routes. `vite.config.ts` may expose compatibility `VITE_*` names only when their compiled values are same-origin gateway values or non-secret placeholders. It must never compile a real Apps Script URL, Spreadsheet ID, editor ID or token into the browser.

Server-side environment exclusively owns:
- `BIBLE365_ENGINE_WEBAPP_URL`
- `BIBLE365_DELIVERY_WEBAPP_URL`
- `BIBLE365_ACCESS_TOKEN`
- `BIBLE365_SPREADSHEET_ID`
- `BIBLE365_EDITOR_ID`

## Backdata/runtime policy
- Front requirements are reverse-mapped into Queens/Seed/T1/T2 requirements.
- Existing organized/published/stored data is reused before regeneration.
- ZERO_COST Queens→ABIDE bridge is the API-free recovery path for mapped inputs.
- Front-local audio/delivery fallback may complete an API-free package when server TTS is unavailable, but it must be explicitly labeled as front-local rather than server-generated audio.
- Scripture source/rights and meaning-distortion gates remain hard gates.

## Runtime gates required before VERIFIED
- exact existing Bible1 bound Script ID readback
- existing deployment/WebApp identity readback
- exactly one intended canonical daily trigger set; Bible3 stale triggers remain deleted
- Queens source consumed into Seed/Writer input
- T1 daily devotional produced
- multilingual/audio package produced or explicit front-local/data-gap status
- T2/App_Delivery_Final produced
- Front returns the same CONTENT_ID/PACKAGE_ID lineage
- same fixture x2
- Drive/Sheet runtime evidence + PURPOSE_FIT/REGRESSION/LESSON_CHECKED
- Vercel Preview x2 before public domain/Production approval

## Current verified truth — 2026-08-27
PASS:
- Browser hardcoded Apps Script URL/token/private-id regressions removed from the integration branch.
- Vite compatibility values resolve to the same-origin `/api/bible365/engine` gateway; real private values remain server-side.
- GitHub lint, production build, unified contract gate and browser API policy have passed after PR #1/#2/#3/#5/#6 integration.
- Legacy Bible3 missing-handler triggers are `DELETED_VERIFIED` and must not be resurrected.
- Stored Bible365 backdata exists.

NOT VERIFIED / BLOCKED:
- Exact existing Bible1 bound `SCRIPT_ID` is still absent from central config, version/trigger/E2E registries, Drive search, GitHub search and available Apps Script failure-email evidence.
- No 2026-08-27 rows were found in `SYS_Runtime_Log`, `01_Workflow_Monitor` or `02_Daily_Front_Package`; live factory execution is not verified.
- Historical runtime evidence shows Queens MAPPED_READY inputs but Writer/Automation/Front Package production stalled.
- Connected Vercel team currently has no Bible365 project; `daily-bible365.com` is not verified as mapped to the canonical repo/runtime.

## Promotion rule
Do not merge/promote/deploy merely because code compiles. Promotion requires existing Bible1 Script identity recovery, same-project sync, canonical trigger/runtime execution, Content→Audio→Delivery→Front same-fixture x2 readback, then Vercel Preview x2 and explicit Production/domain approval.
