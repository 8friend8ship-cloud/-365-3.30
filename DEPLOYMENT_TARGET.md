# Vercel Deployment Target

- Product: 묵상바이블 | Bible 365
- Domain: daily-bible365.com
- Role: canonical customer frontend
- Representative code base: secured/lazy-loaded Bible365 frontend with browser-secret removal and central Writer/Media boundary
- Deployment flow: GitHub representative branch -> Vercel Preview -> Bible Engine/Delivery E2E -> Production -> domain attach
- Required Preview checks: Today content, reading, audio/local playback path, language UI, save/share, failed-engine fallback, no browser secret exposure, central endpoint connection, identical regression twice.
- Production gate: domain remains unattached until Preview checks pass.
- Billing rule: no new paid service or plan change without owner approval.
