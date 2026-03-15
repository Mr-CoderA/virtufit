import { z } from 'zod';

export const tierSchema = z.enum(['nano', 'basic', 'pro']);

export const generateBodySchema = z.object({
  tier: tierSchema.optional().default('basic'),
  garment_description: z.string().max(500).optional(),
  webhook_url: z.string().url().optional().refine((v) => !v || v.startsWith('https://'), 'webhook_url must be HTTPS'),
});

export type GenerateBody = z.infer<typeof generateBodySchema>;
