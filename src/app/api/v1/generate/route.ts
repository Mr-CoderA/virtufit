import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { getSessionAndValidate } from '@/lib/auth';
import { getUserIdFromApiKey } from '@/lib/auth-api-key';
import { uploadTempImage } from '@/lib/cloudinary';
import { generateTryOn } from '@/lib/replicate';
import { prisma } from '@/lib/db';
import { checkGlobalRateLimit, checkGenerateRateLimit } from '@/lib/rate-limit';
import { getIp } from '@/lib/admin-audit';
import { isSafeUrl, isSafeWebhookUrl } from '@/lib/safe-url';
import { sanitizeString } from '@/lib/sanitize';
import { validateAndCleanImage } from '@/lib/image-validation';
import { logger } from '@/lib/logger';
import { addGenerationJob, getGenerationQueue } from '@/lib/generation-queue';
import { getBaseApiUrl } from '@/lib/base-api-url';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const TIER_CREDITS: Record<string, number> = { nano: 1, basic: 1, pro: 3 };
const TIERS = ['nano', 'basic', 'pro'] as const;
const MAX_GARMENTS = 5;

const SWAP_TARGETS = ['full_outfit', 'top', 'bottom', 'dress', 'jacket', 'watch', 'glasses', 'shoes', 'hat', 'bag', 'jewelry', 'other'] as const;

function parseFormData(formData: FormData) {
  const personImage = formData.get('person_image');
  const personImageUrl = formData.get('person_image_url');
  const garmentUrlsRaw = formData.get('garment_urls');
  const tier = formData.get('tier');
  const garmentDescription = formData.get('garment_description');
  const swapTargetRaw = formData.get('swap_target');
  const webhookUrl = formData.get('webhook_url');
  const webhookSecret = formData.get('webhook_secret');

  const garmentFiles: File[] = [];
  const byName = formData.getAll('garment_image');
  for (const f of byName) {
    if (f instanceof File && f.size > 0) garmentFiles.push(f);
  }
  for (let i = 0; i < MAX_GARMENTS && garmentFiles.length < MAX_GARMENTS; i++) {
    const f = formData.get(`garment_image[${i}]`);
    if (f instanceof File && f.size > 0 && !garmentFiles.includes(f)) garmentFiles.push(f);
  }
  if (garmentFiles.length === 0) {
    const single = formData.get('garment_image');
    if (single instanceof File && single.size > 0) garmentFiles.push(single);
  }

  const swapTarget =
    typeof swapTargetRaw === 'string' && SWAP_TARGETS.includes(swapTargetRaw as (typeof SWAP_TARGETS)[number])
      ? (swapTargetRaw as (typeof SWAP_TARGETS)[number])
      : 'full_outfit';

const desc = typeof garmentDescription === 'string' ? garmentDescription.trim() || null : null;
  const webhook = typeof webhookUrl === 'string' ? webhookUrl.trim() || null : null;
  return {
    personImage: personImage instanceof File ? personImage : null,
    personImageUrl: typeof personImageUrl === 'string' ? personImageUrl.trim() || null : null,
    garmentFiles,
    garmentUrls: typeof garmentUrlsRaw === 'string'
      ? garmentUrlsRaw.split(',').map((u) => u.trim()).filter(Boolean)
      : [],
    tier: TIERS.includes((tier as (typeof TIERS)[number]) ?? 'basic') ? (tier as (typeof TIERS)[number]) : 'basic',
    garmentDescription: desc ? sanitizeString(desc, 500) : null,
    swapTarget,
    webhookUrl: webhook || null,
    webhookSecret: typeof webhookSecret === 'string' ? webhookSecret.trim() || null : null,
  };
}

function validateParsed(parsed: ReturnType<typeof parseFormData>): { error: string; details?: { field: string; message: string }[]; status?: number } | null {
  const hasPerson = parsed.personImage !== null || (parsed.personImageUrl && parsed.personImageUrl.length > 0);
  if (!hasPerson) {
    return { error: 'Validation failed', details: [{ field: 'person_image', message: 'Required (or provide person_image_url)' }] };
  }
  const garmentCount = parsed.garmentFiles.length + parsed.garmentUrls.length;
  if (garmentCount === 0) {
    return { error: 'Validation failed', details: [{ field: 'garment_image', message: 'At least one garment image or garment_urls required' }] };
  }
  if (garmentCount > MAX_GARMENTS) {
    return { error: 'Validation failed', details: [{ field: 'garment_image', message: `Maximum ${MAX_GARMENTS} garment images` }] };
  }
  if (parsed.personImage) {
    if (parsed.personImage.size > MAX_FILE_SIZE) {
      return { error: 'File too large', details: [{ field: 'person_image', message: 'Max 10MB' }], status: 413 };
    }
    if (!ALLOWED_MIMES.includes(parsed.personImage.type)) {
      return { error: 'Unsupported file type', details: [{ field: 'person_image', message: 'Use image/jpeg, image/png, or image/webp' }], status: 415 };
    }
  }
  for (const f of parsed.garmentFiles) {
    if (f.size > MAX_FILE_SIZE) {
      return { error: 'File too large', details: [{ field: 'garment_image', message: 'Max 10MB per file' }], status: 413 };
    }
    if (!ALLOWED_MIMES.includes(f.type)) {
      return { error: 'Unsupported file type', details: [{ field: 'garment_image', message: 'Use image/jpeg, image/png, or image/webp' }], status: 415 };
    }
  }
  return null;
}

export async function POST(request: Request) {
  const ip = getIp(request);
  const globalLimit = checkGlobalRateLimit(ip);
  if (!globalLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests', retryAfter: globalLimit.retryAfter },
      { status: 429, headers: globalLimit.retryAfter ? { 'Retry-After': String(globalLimit.retryAfter) } : undefined }
    );
  }

  const apiKey = request.headers.get('X-API-Key');
  const generateKey = apiKey?.trim() || ip;
  const genLimit = checkGenerateRateLimit(generateKey);
  if (!genLimit.allowed) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message: 'Maximum 30 generations per minute per API key',
        retryAfter: genLimit.retryAfter,
      },
      { status: 429, headers: genLimit.retryAfter ? { 'Retry-After': String(genLimit.retryAfter) } : undefined }
    );
  }

  let user: { id: string; credits: number; suspended?: boolean; emailVerified?: boolean } | null = await getUserIdFromApiKey(apiKey);
  if (!user) {
    const validation = await getSessionAndValidate();
    if (validation.valid) {
      const u = await prisma.user.findUnique({
        where: { id: validation.user.id },
        select: { id: true, credits: true, suspended: true, emailVerified: true },
      });
      if (u) user = { ...u, suspended: u.suspended, emailVerified: u.emailVerified };
    } else if (validation.deleted) {
      return NextResponse.json(
        { error: 'Account deleted', message: 'Your account has been closed. If you believe this is a mistake, contact asadalinawaz700@gmail.com', code: 'ACCOUNT_DELETED' },
        { status: 401 }
      );
    }
  }
  if (!user) {
    return NextResponse.json({ error: 'Invalid or missing API key' }, { status: 401 });
  }
  if (!user.emailVerified) {
    return NextResponse.json(
      { error: 'Account not activated', message: 'Please verify your email address to use the API.' },
      { status: 401 }
    );
  }
  if (user.suspended) {
    return NextResponse.json(
      { error: 'Account suspended', message: 'Your VirtuFit account has been suspended. Contact support at asadalinawaz700@gmail.com' },
      { status: 401 }
    );
  }

  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.includes('multipart/form-data')) {
    return NextResponse.json(
      { error: 'Validation failed', details: [{ field: 'body', message: 'Content-Type must be multipart/form-data' }] },
      { status: 422 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 422 });
  }

  const parsed = parseFormData(formData);
  const validationError = validateParsed(parsed);
  if (validationError) {
    const status = validationError.status ?? 422;
    return NextResponse.json(
      validationError.details ? { error: validationError.error, details: validationError.details } : { error: validationError.error },
      { status }
    );
  }

  if (parsed.webhookUrl && !isSafeWebhookUrl(parsed.webhookUrl)) {
    return NextResponse.json({ error: 'Invalid webhook_url (must be HTTPS and not point to private networks)' }, { status: 400 });
  }
  if (parsed.personImageUrl && !isSafeUrl(parsed.personImageUrl)) {
    return NextResponse.json({ error: 'Invalid person_image_url' }, { status: 400 });
  }
  for (const u of parsed.garmentUrls) {
    if (!isSafeUrl(u)) {
      return NextResponse.json({ error: 'Invalid garment URL in garment_urls' }, { status: 400 });
    }
  }

  const garmentCount = parsed.garmentFiles.length + parsed.garmentUrls.length;
  const creditPerRun = TIER_CREDITS[parsed.tier] ?? 1;
  const creditCost = creditPerRun * garmentCount;
  if (user.credits < creditCost) {
    return NextResponse.json(
      { error: 'Insufficient credits', required: creditCost, balance: user.credits, tier: parsed.tier },
      { status: 402 }
    );
  }

  const startTime = Date.now();
  let personUrl: string;
  const garmentUrls: string[] = [];

  try {
    if (parsed.personImageUrl) {
      personUrl = parsed.personImageUrl;
    } else if (parsed.personImage) {
      const buffer = Buffer.from(await parsed.personImage.arrayBuffer());
      const mime = parsed.personImage.type as string;
      const cleaned = await validateAndCleanImage(buffer, mime, ip);
      if (!cleaned.ok) {
        return NextResponse.json({ error: cleaned.error, details: [{ field: 'person_image', message: cleaned.error }] }, { status: 400 });
      }
      personUrl = await uploadTempImage(cleaned.buffer, 'person-photos');
    } else {
      return NextResponse.json({ error: 'Validation failed', details: [{ field: 'person_image', message: 'Required' }] }, { status: 422 });
    }

    for (const f of parsed.garmentFiles) {
      const buf = Buffer.from(await f.arrayBuffer());
      const mime = f.type as string;
      const cleaned = await validateAndCleanImage(buf, mime, ip);
      if (!cleaned.ok) {
        return NextResponse.json({ error: cleaned.error, details: [{ field: 'garment_image', message: cleaned.error }] }, { status: 400 });
      }
      const url = await uploadTempImage(cleaned.buffer, 'garment-photos');
      garmentUrls.push(url);
    }
    garmentUrls.push(...parsed.garmentUrls);
    if (garmentUrls.length > MAX_GARMENTS) {
      garmentUrls.length = MAX_GARMENTS;
    }
  } catch (err) {
    logger.error('Cloudinary upload error', { err: String(err) });
    return NextResponse.json(
      { error: 'Upload failed', details: err instanceof Error ? err.message : 'Unknown error', retryable: true },
      { status: 500 }
    );
  }

  const jobId = crypto.randomUUID();
  const queue = getGenerationQueue();
  if (queue) {
    try {
      await prisma.generationJob.create({
        data: {
          id: jobId,
          userId: user.id,
          status: 'queued',
          tier: parsed.tier,
          personImageUrl: personUrl,
          garmentImageUrls: garmentUrls,
          creditCost,
          webhookUrl: parsed.webhookUrl ?? undefined,
          webhookSecret: parsed.webhookSecret ?? undefined,
          swapTarget: parsed.swapTarget,
        },
      });
      const added = await addGenerationJob({
        jobId,
        userId: user.id,
        tier: parsed.tier,
        personImageUrl: personUrl,
        garmentImageUrls: garmentUrls,
        garmentDescription: parsed.garmentDescription,
        webhookUrl: parsed.webhookUrl,
        webhookSecret: parsed.webhookSecret,
        creditCost,
        swapTarget: parsed.swapTarget,
      });
      if (added) {
        const baseUrl = await getBaseApiUrl();
        const statusUrl = `${baseUrl}/api/v1/jobs/${jobId}`;
        return NextResponse.json(
          {
            accepted: true,
            job_id: jobId,
            status: 'queued',
            status_url: statusUrl,
            message:
              'Generation queued. Poll status_url or provide webhook_url for callback.',
            estimated_seconds: 15,
            credits_reserved: false,
          },
          { status: 202 }
        );
      }
    } catch (err) {
      logger.warn('Queue add failed, falling back to sync', { err: String(err) });
    }
  }

  // Fallback: synchronous processing when Redis/queue unavailable
  const RATE_LIMIT_DELAY_MS = 12_000;
  const results: Awaited<ReturnType<typeof generateTryOn>>[] = [];
  for (let i = 0; i < garmentUrls.length; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, RATE_LIMIT_DELAY_MS));
    const result = await generateTryOn({
      personImageUrl: personUrl,
      garmentImageUrls: [garmentUrls[i]],
      tier: parsed.tier,
      garmentDescription: parsed.garmentDescription ?? undefined,
      swapTarget: parsed.swapTarget,
    });
    results.push(result);
  }

  const firstError = results.find((r) => r.error || r.outputUrls.length === 0);
  if (firstError?.error === 'timeout') {
    return NextResponse.json(
      { error: 'Generation timed out', message: 'The model took too long. Please try again.', retryable: true },
      { status: 504 }
    );
  }
  if (firstError?.error || results.some((r) => r.outputUrls.length === 0)) {
    const details = firstError?.error ?? 'One or more runs returned no output';
    logger.error('Generation failed', { details });
    return NextResponse.json(
      { error: 'Generation failed', details, retryable: true },
      { status: 500 }
    );
  }

  const allOutputUrls = results.flatMap((r) => r.outputUrls);
  const jobIds = results.map((r) => r.jobId || `gen_${Date.now()}`).filter(Boolean);
  const syncJobId = jobIds[0] ?? `gen_${Date.now()}`;
  const processingTimeMs = Date.now() - startTime;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { credits: { decrement: creditCost } },
    }),
    ...results.map((r, i) =>
      prisma.usageLog.create({
        data: {
          userId: user.id,
          tier: parsed.tier,
          creditsUsed: creditPerRun,
          jobId: r.jobId || `${syncJobId}_${i}`,
          outputUrl: r.outputUrls[0] ?? allOutputUrls[i],
        },
      })
    ),
  ]);

  const updatedUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { credits: true },
  });
  const creditsRemaining = updatedUser?.credits ?? user.credits - creditCost;

  if (parsed.webhookUrl) {
    const payload = {
      event: 'tryon.completed',
      job_id: syncJobId,
      output_urls: allOutputUrls,
      tier: parsed.tier,
      credits_used: creditCost,
      credits_remaining: creditsRemaining,
    };
    fetch(parsed.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch((e) => console.error('Webhook fire error:', e));
  }

  return NextResponse.json({
    success: true,
    job_id: syncJobId,
    output_urls: allOutputUrls,
    output_url: allOutputUrls[0],
    tier: parsed.tier,
    credits_used: creditCost,
    credits_remaining: creditsRemaining,
    processing_time_ms: processingTimeMs,
  });
}
