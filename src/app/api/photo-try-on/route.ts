import { prepareProviderImage } from '@/lib/try-on-images';
import { models } from '@decartai/sdk';
import { requireSameOrigin, limitedBody, photoCost, PHOTO_TIER, TryOnError } from '@/lib/try-on-policy';
import { provider, requireTryOnUser, reserve, refund, failure } from '@/lib/try-on-service';
export const runtime = 'nodejs';
export const maxDuration = 180;
export async function POST(request: Request) {
  let reservation: string | undefined;
  try {
    requireSameOrigin(request);
    const user = await requireTryOnUser();
    const client = provider();
    const type = request.headers.get('content-type') || '';
    if (!type.startsWith('multipart/form-data;')) throw new TryOnError('Upload your photo and garment image using the app.');
    const bytes = await limitedBody(request, 3_800_000);
    let form;
    try { form = await new Request('http://upload.local', { method: 'POST', headers: { 'content-type': type }, body: new Uint8Array(bytes) }).formData(); } catch { throw new TryOnError('Could not read the uploaded photos.'); }
    const prompt = form.get('prompt');
    if (typeof prompt !== 'string' || prompt.length < 10 || prompt.length > 2000) throw new TryOnError('Choose a garment before generating.');
    const [person, garment] = await Promise.all([prepareProviderImage(form.get('person'), 'person'), prepareProviderImage(form.get('garment'), 'garment')]);
    const log = await reserve(user.id, PHOTO_TIER, photoCost(), 150); reservation = log.id;
    // Complete the provider request even if a browser closes; avoid retrying
    // a potentially already-billed generation on a client disconnect.
    const result = await client.process({ model: models.image('lucy-image-latest'), data: person, reference_image: garment, resolution: '720p', enhance_prompt: true, prompt: `Edit the person in the input photograph. The separate reference image shows the clothing to wear. ${prompt} Preserve the original person's identity, face, skin tone, hair, body proportions, pose, camera perspective and background. Change only the specified clothes. Match the reference garment's colors, texture, pattern, embroidery and seams. Adapt it to the person's pose and lighting. Do not copy the model or background from the reference. No added text, borders or watermarks.`, signal: AbortSignal.timeout(120_000) });
    if (!result.type.startsWith('image/') || result.size > 4_000_000) throw new Error('Invalid image response');
    await prismaComplete(log.id); reservation = undefined;
    return new Response(result, { headers: { 'Content-Type': result.type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
  } catch (error) {
    if (reservation) { try { await refund(reservation); } catch { console.error('[VirtuFit] Photo refund requires reconciliation', { reservation }); } }
    return failure(error, 'photo generation');
  }
}
async function prismaComplete(id: string) {
  const { prisma } = await import('@/lib/db');
  await prisma.usageLog.update({ where: { id }, data: { note: 'Photo generated. Images are not stored by VirtuFit.' } });
}
