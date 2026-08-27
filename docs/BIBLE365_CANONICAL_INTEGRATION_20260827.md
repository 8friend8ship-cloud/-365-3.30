# Bible365 Canonical Integration — 2026-08-27

## Canonical lock
- APP_ID: `APP_BIBLE365`
- CANONICAL_GROUP: `BIBLE365`
- Canonical GitHub: `8friend8ship-cloud/-365-3.30` / `main`
- Legacy complement: `8friend8ship-cloud/-365-AI-` — archive/read-only after unique-feature diff.
- Do not choose a version only because it is newer. Compare historical/current versions and preserve unique proven strengths.

## Version-union features to preserve
Current canonical strengths:
- current UI/admin flow
- 5-slot daily package
- multilingual/i18n rendering
- cache + stale-while-revalidate behavior
- audio playback/regeneration UX
- delivery/front package model
- API-free/backdata-first front behavior

Legacy strengths to diff before archive:
- direct audio URL/helper behavior
- legacy-only screens or UI interactions
- any delivery compatibility that is not already present in canonical

Do not restore browser API key managers, hardcoded tokens, hardcoded Spreadsheet IDs, or direct browser-to-Apps-Script credential flow.

## Single runtime lineage
`Front -> same-origin server gateway -> existing Bible1 canonical Apps Script -> 1.잠언 365 canonical Sheet -> Bible_Verses/Library -> Queens -> Seed -> T1 -> translation/audio -> T2/App_Delivery_Final -> Front -> readback/QA`

Legacy J365 audio/publisher and Bible3 delivery sheets are migration/read-only evidence sources. Do not install new triggers on them.

## Central-agent inherited rules
1. HISTORY_FIRST / PRE_CHECK before edits.
2. Reuse existing OAuth, clasp, Script ID, Deployment ID and trigger lineage unless actual expiry/change/failure evidence exists.
3. No new Apps Script project/deployment as a workaround.
4. Code/CI/trigger/URL existence is not runtime verification.
5. Completion requires workflow run + result readback + problem/regression check + same-fixture retest + lesson check.
6. Same failure twice without new evidence -> DIAGNOSTIC_HOLD -> ROOT_CAUSE -> minimum fix -> same-fixture retest.
7. Front must not contain secrets, private deployment URLs, Spreadsheet IDs or editor IDs.
8. Preserve stored/backdata result first. Do not silently call mock/fallback and label it LIVE.
9. Queens -> Seed -> T1 -> T2 lineage must remain traceable by IDs/evidence.
10. Generated/test outputs must be purpose-fit audited and successful patterns written back to Seed/Template/Lesson history.

## Webapp connection policy
Browser-visible code uses only same-origin `/api/bible365/*` routes.
Server-side environment owns:
- `BIBLE365_ENGINE_WEBAPP_URL`
- `BIBLE365_DELIVERY_WEBAPP_URL`
- `BIBLE365_ACCESS_TOKEN`
- `BIBLE365_SPREADSHEET_ID`
- `BIBLE365_EDITOR_ID`

Public-domain/Vercel mapping must point to the canonical repo after Preview/runtime x2 verification. `daily-bible365.com` must not remain mapped to the legacy `-365-AI-` candidate once canonical promotion is approved.

## Backdata runtime gates
Required before VERIFIED:
- canonical Bible1 bound Script ID readback
- canonical deployment/WebApp readback
- exactly intended daily trigger set; no resurrected Bible3 stale triggers
- Queens source consumed
- Seed produced
- T1 daily devotional produced
- multilingual/audio package produced or explicit data-gap status
- T2/App_Delivery_Final produced
- Front fetch returns the same content IDs
- same fixture x2
- Drive/Sheet runtime evidence + lesson writeback

## Current known blockers at audit time
- Current front source still contains hardcoded Apps Script URLs, Spreadsheet ID, editor ID and a default browser token. Build gate intentionally fails until this is removed.
- Central registry shows canonical repo `-365-3.30`, while `daily-bible365.com` still has a legacy `-365-AI-` candidate mapping and no verified Vercel Project ID.
- Bible365 Queens trigger is staged/not installed in the central trigger registry.
- Existing `01_Workflow_Monitor` records Writer queue stall, Queens->ABIDE bridge break and no daily Content/Audio/App Delivery output in the last verified run.

## Promotion rule
Do not merge/promote/deploy because the code compiles. Promote only after the direct-browser connection is removed, canonical gateway passes CI, bound Apps Script lineage is read back, and Content -> Audio -> Delivery -> Front passes twice with stored evidence.
