# VirtuFit production release

The home page is the live fitting room and photo studio. Existing login, verified accounts, dashboard, billing, administrator tools and integration APIs remain available. The PostgreSQL schema is unchanged; this release does not run database migrations or overwrite account data.

## Owner configuration

Set `DECART_API_KEY` as a sensitive **server-side production** environment variable in the existing Vercel project `virtufit`. Never use a `NEXT_PUBLIC_` prefix, commit a key, or ask visitors for provider credentials. Preview deployments intentionally receive no production Decart key. Set `DECART_ENABLED=false` and redeploy to disable both paid modes.

The existing DATABASE_URL, JWT_SECRET, JWT_ADMIN_SECRET, billing, email and legacy provider environment variables remain required. JWT secrets must be distinct, random and at least 64 characters. The new feature uses the existing PostgreSQL database for durable reservations and limits; a background worker and Redis are not needed for these two new routes. Older integration queue features keep their original infrastructure requirements.

| Variable | Default | Meaning |
| --- | --- | --- |
| DECART_LIVE_CREDITS_PER_MINUTE | 10 | VirtuFit credits; 30-second sessions cost half |
| DECART_PHOTO_CREDITS | 2 | VirtuFit credits per image |
| DECART_DAILY_CREDIT_LIMIT | 100 | Total new Decart reservation credits per UTC day |
| DECART_USER_DAILY_CREDIT_LIMIT | 40 | Per-account reservation credits per UTC day |
| DECART_DAILY_REQUEST_LIMIT | 50 | Global attempts per UTC day, including refunded failures |
| DECART_USER_DAILY_REQUEST_LIMIT | 10 | Per-account attempts per UTC day |

These are application allowances, not a guaranteed dollar spending cap at Decart. The provider's client token constraints support a per-session duration, model and browser origin, not a per-token spending/speed cap. Configure provider account spending and concurrency limits in Decart as well. Live pricing reserves for the faster tier. Tokens expire after 30 seconds for new connections and allow only the requested 30- or 60-second session. They cannot be revoked early; do not log or persist them. A provider session or token replay remains subject to the provider's own concurrency and billing policies.

Paid routes reject cross-origin requests, require verified, non-suspended accounts, and atomically deduct credits under a shared PostgreSQL transaction lock. Database failure prevents provider calls. A server-side hold prevents overlapping requests from one account, including across Vercel instances. Provider failures restore credits through a guarded transaction; failed refund transactions log the reservation ID for reconciliation. Successfully issued live tokens charge the entire selected duration, including abandoned connections or early stops. Photo requests finish server-side even if the browser leaves; no automatic retry of billed generations.

## Camera, media and uploads

1080p is the default; 720p and faster compute remain selectable. Reported FPS, output dimensions and camera-to-display latency come from SDK metrics; network round-trip time is labelled separately. Physical latency and garment fidelity depend on the provider, network and input and are not guaranteed.

Camera permission is allowed for the current site; microphone access stays disabled. CSP allows the official Decart signaling domains, local hand-tracking worker and WebAssembly. Hand tracking uses a 480-pixel local frame in a worker with one frame in flight. Browser-local wardrobe images use IndexedDB and are sent to Decart only when chosen for AI. Photos and generated outputs are not persisted by VirtuFit; provider retention terms still apply.

Photo inputs can be selected up to 12 MB locally. The browser converts each to JPEG at up to 1600 pixels and 1.8 MB before upload. The server limits the complete request to 3.8 MB, decodes with a pixel limit and removes metadata. Output uses Lucy Image's supported 720p setting and original image download.

## Hosting and release

Repository: https://github.com/Mr-CoderA/virtufit — production branch `main`.

Public domains: https://www.virtufit.xyz and https://virtufit-seven.vercel.app; the apex https://virtufit.xyz redirects to www. DNS nameservers are `ns1.dns-parking.com` / `ns2.dns-parking.com` (Hostinger), while the www CNAME points to Vercel. The observed app is served by Vercel. No separate Hostinger app server was found; changing this repository updates the Vercel app behind the domain.

Build: `npm ci`, `npm run build`. Tests: `npm run test:try-on`. No seed, database reset or db:push is part of a release. Inspect the Git-triggered Vercel deployment, fix build failures before promotion, and verify the public site and API guards after deployment. Roll back using the prior Vercel deployment if needed; no data migration rollback is required.
