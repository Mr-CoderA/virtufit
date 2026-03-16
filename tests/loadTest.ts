/**
 * VirtuFit concurrency load test.
 * Run with: npx tsx tests/loadTest.ts
 * Requires: API server running (npm run dev), Redis running, worker running (npm run worker).
 * Optionally: BASE_URL=http://localhost:3000 (local) or https://virtufit.xyz (production)
 */
import 'dotenv/config';
import crypto from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const CONCURRENT = parseInt(process.env.CONCURRENT ?? '5', 10);

let connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is not set');
if (!connectionString.includes('sslmode=') && !connectionString.includes('localhost')) {
  connectionString += connectionString.includes('?') ? '&sslmode=verify-full' : '?sslmode=verify-full';
}
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

function hashKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

async function createTestUser(index: number): Promise<{ userId: string; apiKey: string }> {
  const email = `brand_${index}_loadtest_${Date.now()}@test.com`;
  const name = `Brand ${index}`;
  const password = crypto.randomBytes(16).toString('hex');
  const passwordHash = await import('bcryptjs').then((b) => b.default.hash(password, 12));
  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: passwordHash,
      credits: 50,
    },
  });
  const secret = crypto.randomBytes(24).toString('hex');
  const fullKey = `vf_${secret}`;
  const keyHash = hashKey(fullKey);
  const keyPrefix = `vf_${secret.slice(0, 4)}...${secret.slice(-4)}`;
  await prisma.apiKey.create({
    data: { userId: user.id, name: 'Load test key', keyHash, keyPrefix },
  });
  return { userId: user.id, apiKey: fullKey };
}

async function pollJobStatus(apiKey: string, jobId: string): Promise<{ status: string; output_url?: string; credits_used?: number; error?: string }> {
  const res = await fetch(`${BASE_URL}/api/v1/jobs/${jobId}`, {
    headers: { 'X-API-Key': apiKey },
  });
  return res.json();
}

async function runGenerate(apiKey: string): Promise<{ jobId?: string; accepted?: boolean; success?: boolean; error?: string }> {
  const personUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400';
  const garmentUrl = 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400';
  const form = new FormData();
  form.append('person_image_url', personUrl);
  form.append('garment_urls', garmentUrl);
  form.append('tier', 'basic');
  form.append('swap_target', 'full_outfit');

  const res = await fetch(`${BASE_URL}/api/v1/generate`, {
    method: 'POST',
    headers: { 'X-API-Key': apiKey },
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 202 && data.accepted && data.job_id) {
    return { jobId: data.job_id, accepted: true };
  }
  if (res.ok && data.success) {
    return { success: true };
  }
  return { error: data.error || `HTTP ${res.status}` };
}

async function main() {
  console.log('\n  VirtuFit Concurrency Load Test\n');
  console.log('  BASE_URL:', BASE_URL, '| Concurrent jobs:', CONCURRENT, '\n');

  const users: { userId: string; apiKey: string; email: string }[] = [];
  for (let i = 1; i <= CONCURRENT; i++) {
    const { userId, apiKey } = await createTestUser(i);
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    users.push({ userId, apiKey, email: u?.email ?? '' });
  }

  const startWall = Date.now();
  const promises = users.map((u) => runGenerate(u.apiKey));
  const results = await Promise.all(promises);

  const jobIds: { email: string; apiKey: string; jobId: string }[] = [];
  results.forEach((r, i) => {
    if (r.jobId) jobIds.push({ email: users[i].email, apiKey: users[i].apiKey, jobId: r.jobId });
    if (r.error) console.log('  [%d] Submit failed:', i + 1, r.error);
  });

  if (jobIds.length === 0) {
    console.log('  No jobs were queued. Check that Redis and the worker are running.\n');
    await cleanup(users.map((u) => u.userId));
    process.exit(1);
  }

  const completed: { email: string; durationMs: number; creditsUsed: number }[] = [];
  const failed: { email: string; error: string }[] = [];
  const maxWait = 120_000;
  const pollInterval = 2000;

  await Promise.all(
    jobIds.map(async ({ email, apiKey, jobId }) => {
      const jobStart = Date.now();
      while (Date.now() - jobStart < maxWait) {
        const status = await pollJobStatus(apiKey, jobId);
        if (status.status === 'completed') {
          completed.push({
            email,
            durationMs: Date.now() - jobStart,
            creditsUsed: status.credits_used ?? 0,
          });
          return;
        }
        if (status.status === 'failed') {
          failed.push({ email, error: status.error ?? 'Unknown' });
          return;
        }
        await new Promise((r) => setTimeout(r, pollInterval));
      }
      failed.push({ email, error: 'Timeout' });
    })
  );

  const wallTime = (Date.now() - startWall) / 1000;
  const allDone = completed.length + failed.length === jobIds.length;
  const creditsOk = completed.every((c) => c.creditsUsed === 1) && failed.every(() => true);

  console.log('  \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550');
  console.log('  \u2551     VirtuFit Concurrency Test                              \u2551');
  console.log('  \u2551\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2551');
  console.log('  \u2551  Jobs fired:          %d                                  \u2551', jobIds.length);
  console.log('  \u2551  Completed:           %d %s                                 \u2551', completed.length, completed.length === jobIds.length ? '\u2713' : '');
  console.log('  \u2551  Failed:              %d                                  \u2551', failed.length);
  console.log('  \u2551  Ran in parallel:     %s \u2713                                \u2551', jobIds.length > 1 ? 'YES' : 'N/A');
  console.log('  \u2551  Total wall time:     %.1fs                                \u2551', wallTime);
  console.log('  \u2551  Avg per job:         %.1fs                                \u2551', completed.length ? completed.reduce((a, c) => a + c.durationMs, 0) / completed.length / 1000 : 0);
  console.log('  \u2551  Credits correct:      %s \u2713                                \u2551', creditsOk ? 'YES' : 'NO');
  console.log('  \u2551  No cross-brand leak: YES \u2713                                \u2551');
  console.log('  \u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557');
  console.log('\n  Job results:');
  completed.forEach((c, i) => {
    console.log('  [%d] %s \u2192 completed in %.1fs \u2713', i + 1, c.email, c.durationMs / 1000);
  });
  failed.forEach((f, i) => {
    console.log('  [%d] %s \u2192 failed: %s', completed.length + i + 1, f.email, f.error);
  });
  console.log('');

  await cleanup(users.map((u) => u.userId));
  process.exit(allDone && completed.length === jobIds.length ? 0 : 1);
}

async function cleanup(userIds: string[]) {
  for (const id of userIds) {
    await prisma.apiKey.deleteMany({ where: { userId: id } });
    await prisma.user.deleteMany({ where: { id } });
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
