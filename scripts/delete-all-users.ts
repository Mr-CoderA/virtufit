/**
 * Permanently delete all users (brands) and their related data.
 * Does NOT delete admins, plans, app settings, or contact submissions.
 *
 * Run: npx tsx scripts/delete-all-users.ts --confirm
 * (Requires --confirm to avoid accidental execution.)
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
    console.error('This script permanently deletes ALL users (brands) and their data.');
    console.error('Run with --confirm to proceed:');
    console.error('  npx tsx scripts/delete-all-users.ts --confirm');
    process.exit(1);
  }

  const userCount = await prisma.user.count();
  const usageLogCount = await prisma.usageLog.count();
  const apiKeyCount = await prisma.apiKey.count();
  const notificationCount = await prisma.notification.count();
  const topUpCount = await prisma.topUp.count();
  const generationJobCount = await prisma.generationJob.count();

  console.log('Current counts:');
  console.log('  Users (brands):     ', userCount);
  console.log('  UsageLogs:          ', usageLogCount);
  console.log('  ApiKeys:            ', apiKeyCount);
  console.log('  Notifications:      ', notificationCount);
  console.log('  TopUps:             ', topUpCount);
  console.log('  GenerationJobs:     ', generationJobCount);

  if (userCount === 0) {
    console.log('\nNo users to delete. Exiting.');
    await prisma.$disconnect();
    process.exit(0);
  }

  console.log('\nDeleting all users (related records will be cascade-deleted)...');

  // Delete in explicit order to avoid FK issues; Prisma schema has onDelete: Cascade
  // but explicit order is clearer and works regardless of DB cascade state
  const delJobs = await prisma.generationJob.deleteMany({});
  const delUsage = await prisma.usageLog.deleteMany({});
  const delTopUps = await prisma.topUp.deleteMany({});
  const delNotifs = await prisma.notification.deleteMany({});
  const delKeys = await prisma.apiKey.deleteMany({});
  const delUsers = await prisma.user.deleteMany({});

  console.log('Deleted:');
  console.log('  GenerationJobs:     ', delJobs.count);
  console.log('  UsageLogs:          ', delUsage.count);
  console.log('  TopUps:             ', delTopUps.count);
  console.log('  Notifications:      ', delNotifs.count);
  console.log('  ApiKeys:            ', delKeys.count);
  console.log('  Users:              ', delUsers.count);
  console.log('\nDone. All users and their data have been permanently removed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
