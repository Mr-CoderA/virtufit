import { z } from 'zod';

export const creditAmountSchema = z.object({
  amount: z.number().int().min(1).max(100_000),
  type: z.enum(['grant', 'deduct']),
  reason: z.string().min(10).max(500).trim(),
});

export const deleteBrandSchema = z.object({
  reason: z.string().min(10).max(500).trim(),
});

export const creditRateSchema = z.object({
  rate: z.number().min(0.01).max(10),
});

export const creditCostsSchema = z.object({
  nano: z.number().int().min(1).max(10),
  basic: z.number().int().min(1).max(10),
  pro: z.number().int().min(1).max(10),
});
