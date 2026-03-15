import { z } from 'zod';

const passwordMin = 8;
const passwordMax = 128;

export const registerSchema = z.object({
  email: z.string().email().max(254).trim(),
  name: z.string().min(2).max(100).trim(),
  password: z.string().min(passwordMin).max(passwordMax),
});

export const loginSchema = z.object({
  email: z.string().email().max(254).trim(),
  password: z.string().min(1).max(200),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(passwordMin).max(passwordMax),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
