# Vercel Deployment Target

- Product: 묵상바이블 | Bible 365
- Domain: daily-bible365.com
- Role: canonical customer frontend
- Representative code base: secured/lazy-loaded Bible365 frontend with browser-secret removal
- Frontend repository: 8friend8ship-cloud/-365-3.30
- Canonical runtime data sheet: `1.잠언 365: AI 지혜의 등불` (`1HK4ATRZ-lSZ4fyuZi4ypHodgGZK1kBMsEFkAxOm9904`)
- Canonical output surfaces: `02_Daily_Front_Package`, `03_Public_Output`
- Upstream writer source: `J365_AI_작가에이전트_V2_운영시트` until the new Writer Content Factory is production-verified
- New writer reference: `01_WRITER_CONTENT_FACTORY_V001` is a reference/template only and MUST NOT be connected directly to the customer frontend yet
- Connection policy: customer frontend reads a single Bible delivery endpoint/config contract; it must not call writer/admin endpoints directly and must not hardcode sheet IDs, WebApp URLs, or long-lived tokens in browser code
- Target contract: `BIBLE_DELIVERY_V1` / `getSignedDailyPackage` (DAILY_PACKAGE_V1), with last-good-package fallback
- Deployment flow: GitHub representative branch -> Vercel Preview -> Bible delivery endpoint E2E -> Production -> domain attach
- Required Preview checks: Today content, reading, audio/local playback path, language UI, save/share, failed-engine fallback, no browser secret exposure, central endpoint connection, identical regression twice
- Current blocker: canonical Bible Apps Script deployment URL is not yet verified in the central registry; do not substitute the generic Writer Content Factory WebApp URL
- Production gate: domain remains unattached until Preview checks pass
- Billing rule: no new paid service or plan change without owner approval
