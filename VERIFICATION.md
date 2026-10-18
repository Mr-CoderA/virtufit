# Free public launch verification — 18 October 2026

Application source commit: `0910604a8a87ba10f3f2c9964bc02346dd4d4f8b`.
Production deployment: `dpl_GSXHEzjY6ygKJ2ccpjXtnadqiDV3` — READY, with all existing production aliases assigned.

The following documentation/screenshot commit changes no application behavior.

## Verified

| Boundary | Result |
| --- | --- |
| Build and types | Production Webpack build and TypeScript checks passed. The supported Webpack compiler avoids a local Turbopack process-binding restriction. |
| Automated tests | 22 passed, including anonymous allowances, cookie-reset network cap, concurrency/expiry, payment-off defaults and real checkout-handler rejection, authenticated webhook handling, image decoding/metadata removal, body-size limits, same-origin proxy handling, garment prompts, gesture mapping and truthful metrics. |
| Dependencies | Production audit reported zero known findings. The final redesign changes no dependency versions. |
| Public domains | www.virtufit.xyz, virtufit.xyz and virtufit-seven.vercel.app returned the new studio with HTTP 200 after redirects. The apex resolves to www. |
| Runtime mode | Every public alias returned configured=true, freeAccess=true and paymentsEnabled=false from /api/status. |
| Anonymous database/provider path | An anonymous 30-second request returned HTTP 200, an expiring token different from the permanent owner key, and a signed visitor cookie. No account or authentication credential was supplied. No stream was connected. |
| Durable overlap protection | An immediate second request with the same visitor cookie returned HTTP 429 with the existing-session hold message. This path uses PostgreSQL rather than in-memory state. |
| Checkout disabled | Anonymous POST /api/topup/create-checkout returned HTTP 403 with PAYMENTS_DISABLED before any payment call. |
| Input and origin checks | A 300-second session was rejected with HTTP 400; malformed photo submission returned HTTP 400; a foreign-origin token request returned HTTP 403. |
| Assets and privacy boundaries | Worker, model, WebAssembly and garment preview assets returned HTTP 200 with expected media types. /api/config, /.local-config.json and /.env.local returned HTTP 404. |
| Production browser | The live fitting room and photo studio rendered at the public domain on desktop and a 390px mobile viewport. Switching modes worked. No browser errors were observed. |
| Shared public UI | Local browser review covered the fitting room, upload dialog, studio guide, mobile navigation, sign-in and contact pages, using the shared palette and components. |
| Open source | GitHub reports the repository public and recognizes its root license as MIT. Third-party licenses and notices are retained. |
| Secret handling | Staged sources and assets were checked against the existing owner key; no match or private local environment file was staged. The key is a sensitive production server environment variable. |

## Deliberately not exercised

The owner requested skipping paid testing. No paid realtime stream, generated photo, fast-tier test, personal-photo upload, checkout, external email or purchase was started. Actual garment fidelity, glass-to-glass video latency, physical pointing accuracy and generated-image download require an ordinary real session and remain unmeasured for this release.

An authenticated account session was not available for a manual dashboard/settings walkthrough. Their source, shared components and types compiled successfully; historical account and billing records were preserved. The payment callback handler was left intact and its signature/acceptance path was checked with a non-order fixture, without creating or modifying financial records.

The allowance check minted one non-billable client token and consumed one anonymous attempt/hold. It did not start GPU generation. Limits are application controls, not a guaranteed dollar cap at the provider; see PRODUCTION.md for token replay and provider budget/concurrency limits.

## Screenshots

- [Deployed desktop studio](docs/screenshots/studio-desktop.jpg)
- [Deployed mobile photo studio](docs/screenshots/studio-mobile.jpg)
