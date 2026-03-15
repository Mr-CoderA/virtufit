import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN ?? undefined,
});

const TIER_RESOLUTION: Record<string, string> = {
  nano: '512',
  basic: '1K',
  pro: '2K',
};

export type TryOnParams = {
  personImageUrl: string;
  garmentImageUrls: string[];
  tier?: 'nano' | 'basic' | 'pro';
  garmentDescription?: string | null;
  swapTarget?: string | null;
};

export type TryOnResult = { outputUrls: string[]; jobId: string; error: null } | { outputUrls: []; jobId: string; error: string };

const SWAP_TARGET_PROMPTS: Record<string, { preserve: string; swap: string; instruction: string }> = {
  full_outfit: {
    preserve: 'face, facial expression, skin tone, hair, pose, body position, and the entire background.',
    swap: 'Replace their entire outfit and all visible clothing with the garment(s) from the reference image(s).',
    instruction: 'Apply the full outfit so it looks like one coherent look. Realistic fit, fabric drape, lighting and shadows matching the person photo. Output must look like a single real photograph.',
  },
  top: {
    preserve: 'face, expression, skin tone, hair, pose, body, legs, feet, background, and everything the person is wearing from the waist down. Do not change their bottom clothing, shoes, or any accessories below the waist.',
    swap: 'Replace ONLY their top (shirt, blouse, t-shirt, sweater, or upper garment) with the garment shown in the reference image.',
    instruction: 'The new top must match the person’s pose and lighting. Natural fit and wrinkles. Do not alter anything except the upper body clothing.',
  },
  bottom: {
    preserve: 'face, expression, skin tone, hair, pose, upper body, arms, background, and everything they are wearing on their torso and above. Do not change their top, jacket, or any accessories on the upper body.',
    swap: 'Replace ONLY their bottom (pants, skirt, shorts, or lower garment) with the garment shown in the reference image.',
    instruction: 'The new bottom must match the person’s pose and lighting. Natural fit and drape. Do not alter anything except the lower body clothing.',
  },
  dress: {
    preserve: 'face, expression, skin tone, hair, pose, body position, and the full background.',
    swap: 'Replace their dress or one-piece garment with the dress/one-piece shown in the reference image.',
    instruction: 'The dress must look natural on their body with correct fit and fabric flow. Lighting and shadows consistent with the photo. Output must look like a real photograph.',
  },
  jacket: {
    preserve: 'face, expression, skin tone, hair, pose, body, and everything they wear under the jacket (shirt, top) and below (pants, shoes), plus the full background.',
    swap: 'Replace ONLY their jacket, coat, or outer layer with the jacket/coat shown in the reference image.',
    instruction: 'The new jacket must sit naturally over their current clothes. Realistic fit and wrinkles. Do not change their inner top, bottom, or accessories except the outer layer.',
  },
  watch: {
    preserve: 'face, expression, skin tone, hair, pose, body, all clothing, and the full background. Do not change any clothing or other accessories.',
    swap: 'Replace ONLY the watch on their wrist with the watch shown in the reference image.',
    instruction: 'The watch must sit naturally on their wrist, correct size and angle. Keep all other wearables and the entire scene unchanged.',
  },
  glasses: {
    preserve: 'face shape, expression, skin tone, hair, pose, body, all clothing, and the full background. Do not change any clothing or other accessories.',
    swap: 'Replace ONLY their glasses or sunglasses with the glasses/sunglasses shown in the reference image.',
    instruction: 'The new glasses must sit correctly on their face (bridge, ears), with natural reflections. Do not alter face, hair, or anything else.',
  },
  shoes: {
    preserve: 'face, expression, skin tone, hair, pose, body, all clothing (top, bottom, dress), and the full background. Do not change any clothing or accessories except footwear.',
    swap: 'Replace ONLY their shoes or footwear with the shoes shown in the reference image.',
    instruction: 'The new shoes must match their pose and the ground/floor. Correct perspective and lighting. Do not alter any clothing or other items.',
  },
  hat: {
    preserve: 'face, expression, skin tone, hair (under the hat), pose, body, all clothing, and the full background.',
    swap: 'Replace ONLY their hat, cap, or headwear with the hat/cap shown in the reference image.',
    instruction: 'The hat must sit naturally on their head with correct fit and shadows. Do not change hair, face, or any other wearables.',
  },
  bag: {
    preserve: 'face, expression, skin tone, hair, pose, body, all clothing, and the full background. Do not change clothing or other accessories.',
    swap: 'Replace ONLY their bag, purse, or carried accessory with the bag/accessory shown in the reference image.',
    instruction: 'The bag must look naturally carried or worn. Correct straps and position. Do not alter clothing or the person.',
  },
  jewelry: {
    preserve: 'face, expression, skin tone, hair, pose, body, all clothing, and the full background. Do not change clothing or non-jewelry accessories.',
    swap: 'Replace ONLY their jewelry (necklace, earrings, bracelet, ring, or the specific piece shown) with the jewelry in the reference image.',
    instruction: 'The jewelry must sit naturally on the body (neck, ears, wrist, etc.) with realistic metal/reflections. Do not alter clothing or other items.',
  },
  other: {
    preserve: 'face, expression, skin tone, hair, pose, body, and the full background. Do not change any item you are not explicitly asked to swap.',
    swap: 'Replace only the specific wearable or item described with the item shown in the reference image.',
    instruction: 'Apply the new item so it looks natural and consistent with the photo. Do not alter anything else.',
  },
};

function buildTryOnPrompt(garmentDesc: string, garmentCount: number, swapTarget: string): string {
  const key = swapTarget in SWAP_TARGET_PROMPTS ? swapTarget : 'other';
  const { preserve, swap, instruction } = SWAP_TARGET_PROMPTS[key];

  const itemRef =
    garmentCount === 1
      ? garmentDesc
      : `the ${garmentCount} items shown in the reference images (in order).`;

  return `You are doing a virtual try-on edit on a photo of a person.

STRICT RULES — follow exactly:
1. KEEP UNCHANGED: ${preserve}
2. SWAP ONLY THIS: ${swap} The new item(s) to apply: ${itemRef}
3. RESULT: ${instruction}

Do not change the person's identity, pose, or background. Do not add or remove any item except the one(s) being swapped. Output must be a single, photorealistic image.`;
}

export async function generateTryOn(params: TryOnParams): Promise<TryOnResult> {
  const {
    personImageUrl,
    garmentImageUrls,
    tier = 'basic',
    garmentDescription = null,
    swapTarget = 'full_outfit',
  } = params;

  const resolution = TIER_RESOLUTION[tier] ?? TIER_RESOLUTION.basic;
  const garmentCount = garmentImageUrls.length;
  const garmentDesc =
    garmentDescription ??
    (garmentCount === 1
      ? 'the item shown in the reference image'
      : `the ${garmentCount} items shown in the reference images (first image is the person, following images are the products to apply)`);

  const prompt = buildTryOnPrompt(garmentDesc ?? '', garmentCount, swapTarget ?? 'full_outfit');

  // google/nano-banana-pro schema: prompt, resolution, image_input (array, up to 14), aspect_ratio, output_format, safety_filter_level
  const imageInput = [personImageUrl, ...garmentImageUrls];

  const runOnce = async (): Promise<TryOnResult> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120_000);

    try {
      const output = await replicate.run('google/nano-banana-pro', {
        input: {
          prompt,
          resolution,
          image_input: imageInput,
          aspect_ratio: 'match_input_image',
          output_format: 'jpg',
          safety_filter_level: 'block_only_high',
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const outputUrls = normalizeReplicateOutput(output);

      const jobId = typeof (output as { id?: string })?.id === 'string' ? (output as { id: string }).id : `gen_${Date.now()}`;

      if (outputUrls.length === 0) {
        return { outputUrls: [], jobId, error: 'Model returned no output — try again' };
      }

      return { outputUrls, jobId, error: null };
    } catch (err) {
      clearTimeout(timeout);
      if (err instanceof Error && err.name === 'AbortError') {
        return { outputUrls: [], jobId: '', error: 'timeout' };
      }
      const message = err instanceof Error ? err.message : String(err);
      if ((message.includes('429') || message.includes('Too Many Requests')) && message.includes('retry_after')) {
        const match = message.match(/"retry_after":\s*(\d+)/);
        const sec = match ? Math.min(Number(match[1]) + 1, 60) : 10;
        console.error('[Replicate] Rate limited (429), retrying after', sec, 's');
        await new Promise((r) => setTimeout(r, sec * 1000));
        return runOnce();
      }
      console.error('[Replicate] generateTryOn error:', err);
      return {
        outputUrls: [],
        jobId: '',
        error: message,
      };
    }
  };

  return runOnce();
}

function normalizeReplicateOutput(output: unknown): string[] {
  if (output == null) return [];
  const unwrapped = typeof output === 'object' && output !== null && 'output' in output
    ? (output as { output: unknown }).output
    : output;

  const asStr = (v: unknown): string | null => {
    if (typeof v === 'string' && v.length > 0) return v;
    if (typeof v === 'object' && v !== null && typeof (v as { url?: () => unknown }).url === 'function') {
      const urlResult = (v as { url: () => URL | string }).url();
      const s = typeof urlResult === 'string' ? urlResult : urlResult?.href ?? urlResult?.toString?.();
      return typeof s === 'string' && s.length > 0 ? s : null;
    }
    return null;
  };

  if (Array.isArray(unwrapped)) {
    const urls = unwrapped.map(asStr).filter((u): u is string => u != null);
    return urls;
  }
  const single = asStr(unwrapped);
  return single != null ? [single] : [];
}

export { replicate };
