# VirtuFit production operations

## One platform

Repository: https://github.com/Mr-CoderA/virtufit. Production branch: `main`.

Vercel project `virtufit` serves https://www.virtufit.xyz and https://virtufit-seven.vercel.app. https://virtufit.xyz redirects to www. Hostinger supplies DNS (`ns1.dns-parking.com` / `ns2.dns-parking.com`); the www CNAME points to Vercel. There is no separate Hostinger copy of the app to update.

The fitting room, photo studio, guide, contact and account pages use one shared navigation, footer and design-token system in `src/app/globals.css`. The old integration endpoints and historical account/billing records are retained for compatibility.

## Free mode and payments

`PAYMENTS_ENABLED` is false unless its value is exactly `true`. Keep it false for this launch. In free mode public live and photo routes do not require an account, verified email or credit balance; checkout initiation returns `PAYMENTS_DISABLED` before authentication or any external payment call. The previous paid implementation is retained behind the explicit toggle. Turning payments back on requires reviewing the paid UI, prices, provider settings and operating policy before deploying.

Do not disable or change the existing billing webhook when disabling new payments: legitimate pending callbacks must still be authenticated and reconciled. No account balances, top-ups, orders, subscriptions or payment records are deleted, reset or refunded by this release.

## Secrets and services

Required for the hosted studio: DATABASE_URL; distinct random JWT_SECRET and JWT_ADMIN_SECRET values of at least 64 characters; DECART_API_KEY. The Decart key is a sensitive server-side production environment variable. It must never be in a NEXT_PUBLIC variable, response, log, public bundle or Git history.

Optional account email needs RESEND_API_KEY and a verified EMAIL_FROM. Existing integrations retain their original Replicate/Cloudinary/Redis requirements. Public studio routes do not use those services. Existing payment credentials remain in place for callback handling; they are only needed for new checkout when payments are explicitly enabled.

DECART_ENABLED=false disables both AI modes after deployment. Local camera preview and wardrobe remain available. Preview deployments intentionally have no production Decart key.

## Durable anonymous allowances

| Variable | Default | Meaning |
| --- | --- | --- |
| DECART_DAILY_REQUEST_LIMIT | 50 | Shared attempts per UTC day |
| DECART_VISITOR_DAILY_REQUEST_LIMIT | 5 | Attempts per signed browser cookie per UTC day |
| DECART_NETWORK_DAILY_REQUEST_LIMIT | 10 | Attempts shared by a network per UTC day |
| DECART_CONCURRENT_LIMIT | 2 | Shared active reservations |
| DECART_DAILY_UNIT_LIMIT | 100 | Internal cost-control units per UTC day |

A 60-second live request reserves 10 units, 30 seconds reserves 5 and a photo reserves 2. These are owner-side operating limits, not visitor money or credit balances. Both failed and cancelled attempts remain counted, including units. Provider failures release concurrency holds, while issued live tokens keep their server hold until the maximum session and connection window ends. No browser stop callback can free that hold early.

The existing AppSetting table stores JSON counters under `virtufit:free:v1:`. PostgreSQL advisory transaction locking serializes updates across all Vercel instances. Only daily HMAC hashes of browser/network identifiers, counts, and temporary holds are stored. Browser identity is a signed, HttpOnly, SameSite=Lax cookie. Clearing it cannot bypass the separate network or global limits. Raw IPs and uploaded photographs are not stored in these records. Counters older than seven days are removed; unrelated settings and billing records are never affected. Database failure prevents provider calls.

The hosted app relies on Vercel's forwarded-address header handling. Self-host behind a trusted proxy that overwrites incoming forwarding headers. Global request/unit/concurrency limits still bound requests issued by the app even if a visitor changes identity or address.

These are application allowances, not a guaranteed dollar spending cap. Decart client tokens can be replayed during their short validity window, and browser origin restrictions do not stop a non-browser client spoofing Origin. Configure provider spending and concurrency limits in Decart too. Tokens expire after 30 seconds for new connections, allow only lucy-vton-latest on the current origin, and carry a 30- or 60-second maximum session duration. Do not log or persist them.

## Images and camera

1080p live is requested by default. 720p and faster processing are optional. Actual FPS, dimensions and camera-to-display delay come from SDK statistics; network RTT is labelled separately. Performance and fidelity are not guaranteed.

Camera permission is restricted to the current site; microphone access is disabled. Hand tracking processes 480-pixel local frames in a worker with one frame in flight. The saved wardrobe is browser-local IndexedDB. AI requests send the selected inputs to Decart, whose processing and retention terms apply.

Photo inputs selected locally can be up to 12 MB. The browser resizes each to JPEG, up to 1600 pixels and 1.8 MB. The server bounds the whole request at 3.8 MB, verifies actual decoded formats, removes metadata and imposes a pixel limit. The result is a downloadable 720p image. VirtuFit does not persist inputs or results. Photo processing completes server-side even if the browser leaves, without automatically repeating a potentially billed request.

## Release and rollback

Use npm ci, npm run test:try-on and npm run build. No seed, schema push or data migration is part of deployment. Inspect the Git-triggered Vercel deployment and verify its commit and public aliases. Roll back to the previous Vercel deployment if needed; no data rollback is required.

The owner requested skipping paid tests. Automated verification uses fixtures and input/policy checks; no real paid video, image generation, personal-photo upload or purchase is authorized for this release. Record that residual end-to-end verification gap in the release report.
