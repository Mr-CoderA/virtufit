This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Admin panel

A separate, password-protected control center for the VirtuFit owner.

- **URL:** [/admin/login](http://localhost:3000/admin/login)
- **Default credentials (change after first login):**
  - Email: `asadalinawaz700@gmail.com`
  - Password: `Admin@123`

**Important:** Change the default password immediately after first login via **Admin → Profile → Change password**.

**Seed command** (creates default admin + plans + app settings):

```bash
cd frontend && npm run seed
```

**First login checklist:**

1. Change password at `/admin/profile`
2. Verify Replicate connection at `/admin/api-settings`
3. Verify Lemon Squeezy webhook at `/admin/api-settings`
4. Set credit rate at `/admin/credits`
5. Review plan features at `/admin/plans`

---

## Account management

### Soft delete

Brands are never hard deleted. Deleting an account:

- Blocks login immediately
- Invalidates all API keys immediately
- Preserves all data forever
- Is fully reversible via Admin → Brands → [brand] → Restore account

### To delete a brand

Admin → Brands → [brand] → Danger zone → Delete account. A reason is required (min 10 characters).

### To restore a brand

Admin → Brands → toggle **Show deleted accounts** → [brand] → **Restore account**. The brand can log in again immediately after restore.

### Hard delete

Not supported. Contact your database administrator if permanent deletion is legally required (e.g. GDPR).

---

## Email setup — Resend

VirtuFit uses [Resend](https://resend.com) for verification and transactional emails (free tier: 3,000 emails/month, no credit card).

1. Sign up at [resend.com](https://resend.com) (free, no credit card).
2. Go to **API Keys** → **Create API key** → set as `RESEND_API_KEY` in `.env`.
3. **Production (virtufit.xyz):** Verify the domain in Resend → **Domains**, then set `RESEND_FROM_EMAIL=noreply@virtufit.xyz` and `RESEND_FROM_NAME=VirtuFit` (or `EMAIL_FROM="VirtuFit <noreply@virtufit.xyz>"`). The app defaults to `VirtuFit <noreply@virtufit.xyz>` when env is not set.

**Testing emails locally:** Resend dashboard shows all sent emails in real time. Go to [resend.com](https://resend.com) → **Emails** to see delivery status and preview the HTML of every email sent.

**Existing users (after enabling email verification):** If you already have brands in the database, set `emailVerified = true` for them so they can still log in:

```sql
UPDATE "User" SET "emailVerified" = true WHERE "emailVerified" = false;
```

---

## Redis & async generation

For concurrent try-on generations (multiple brands at once), run Redis and the worker.

**Redis setup**

- **Docker:** `docker run -d -p 6379:6379 --name virtufit-redis redis:alpine`
- **Windows (no Docker):** [Redis for Windows](https://github.com/microsoftarchive/redis/releases) — run `redis-server.exe`
- **Upstash (cloud):** Sign up at [upstash.com](https://upstash.com), create a Redis database, copy `REDIS_URL` into `.env`

Set in `.env`: `REDIS_URL=redis://localhost:6379` (or your Upstash URL).

**Worker (processes queued jobs)**

```bash
npm run worker
```

Keep the worker running in a separate terminal. Concurrency is set by `QUEUE_CONCURRENCY` (default 5).

If Redis is unavailable, the API falls back to **synchronous** processing (one request at a time, same as before).

**Load test**

With the app, Redis, and worker running:

```bash
npm run test:load
# Or with 10 concurrent jobs: CONCURRENT=10 npm run test:load
```

---

## Production URLs

| Resource | URL |
|----------|-----|
| Frontend | https://virtufit.xyz |
| Backend | https://virtufit.xyz |
| Admin | https://virtufit.xyz/admin |
| API base | https://virtufit.xyz/api |
| Widget | https://virtufit.xyz/widget/tryon.js |
| Docs | https://virtufit.xyz/docs |

### Webhooks (set in provider dashboards)

- **Lemon Squeezy:** `https://virtufit.xyz/api/webhooks/lemonsqueezy`

### Integration script tag (Shopify, WordPress, any site)

```html
<script src="https://virtufit.xyz/widget/tryon.js"></script>
```

### Email (Resend)

- **Provider:** Resend (resend.com)
- **From address:** noreply@virtufit.xyz

Emails sent: welcome on registration (after verification), top-up confirmation after successful payment, enterprise inquiry notification to hello@virtufit.xyz, plus verification and other transactional emails.

To configure:
1. Add `RESEND_API_KEY` from resend.com → API Keys
2. Verify virtufit.xyz domain in Resend → Domains
3. Set `RESEND_FROM_EMAIL=noreply@virtufit.xyz`, `RESEND_FROM_NAME=VirtuFit`

### Vercel environment variables

In Vercel → Project → Settings → Environment Variables, set (production):

- `FRONTEND_URL` = `https://virtufit.xyz`
- `BACKEND_URL` = `https://virtufit.xyz`
- `NEXT_PUBLIC_API_URL` = `https://virtufit.xyz`
- `NEXT_PUBLIC_APP_URL` = `https://virtufit.xyz`
- `APP_URL` = `https://virtufit.xyz`
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL=noreply@virtufit.xyz`, `RESEND_FROM_NAME=VirtuFit`
- Plus: `DATABASE_URL`, `JWT_SECRET`, `JWT_ADMIN_SECRET`, `REPLICATE_API_TOKEN`, Cloudinary, Lemon Squeezy, Redis, etc. (see `.env.example`).

---

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

- Set **Root Directory** to `frontend` if the repo root is the monorepo.
- Add all environment variables from `.env.example` (use production URLs above).

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
