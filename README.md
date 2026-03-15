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
  - Email: `admin@virtufit.com`
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

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
