/**
 * Fix TopUp amountCents that were stored 100x too large (Lemon Squeezy sends
 * total_usd in cents; the webhook previously multiplied by 100).
 *
 * Only corrects records with orderId set (from Lemon Squeezy). Leaves others unchanged.
 *
 * Run: npx tsx scripts/fix-topup-amounts.ts --confirm
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

let connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('FATAL: DATABASE_URL is not set');
  process.exit(1);
}
if (!connectionString.includes('sslmode=') && !connectionString.includes('localhost')) {
  connectionString += connectionString.includes('?') ? '&sslmode=verify-full' : '?sslmode=verify-full';
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const hasConfirm = process.argv.includes('--confirm');
  if (!hasConfirm) {
    console.error('This script updates TopUp amountCents (divides by 100 for Lemon Squeezy orders).');
    console.error('Run with --confirm to proceed:');
    console.error('  npx tsx scripts/fix-topup-amounts.ts --confirm');
    process.exit(1);
  }

  const toFix = await prisma.topUp.findMany({
    where: { orderId: { not: null } },
    select: { id: true, amountCents: true, orderId: true, createdAt: true },
  });

  if (toFix.length === 0) {
    console.log('No TopUp records with orderId found. Nothing to fix.');
    process.exit(0);
  }

  console.log(`Found ${toFix.length} TopUp(s) from Lemon Squeezy to correct.\n`);

  for (const row of toFix) {
    const wrongCents = row.amountCents;
    const correctCents = Math.round(wrongCents / 100);
    const wrongDollars = (wrongCents / 100).toFixed(2);
    const correctDollars = (correctCents / 100).toFixed(2);

    await prisma.topUp.update({
      where: { id: row.id },
      data: { amountCents: correctCents },
    });

    console.log(`  ${row.id}: $${wrongDollars} → $${correctDollars} (orderId: ${row.orderId})`);
  }

  console.log(`\nDone. Corrected ${toFix.length} record(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
