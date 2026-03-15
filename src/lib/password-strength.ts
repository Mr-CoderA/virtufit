import zxcvbn from 'zxcvbn';

const MIN_SCORE = 2; // 0–4 scale; 2 = fair, 3 = good, 4 = strong

export interface PasswordRequirements {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumber: boolean;
  requireSpecial: boolean;
  minScore: number;
}

export const PASSWORD_RULES: PasswordRequirements = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
  minScore: MIN_SCORE,
};

const SPECIAL = '!@#$%^&*()_+-=[]{}|;:,.<>?';

export function validatePasswordStrength(password: string): { valid: boolean; message?: string } {
  if (password.length < PASSWORD_RULES.minLength) {
    return { valid: false, message: `Password must be at least ${PASSWORD_RULES.minLength} characters` };
  }
  if (password.length > PASSWORD_RULES.maxLength) {
    return { valid: false, message: `Password must be at most ${PASSWORD_RULES.maxLength} characters` };
  }
  if (PASSWORD_RULES.requireUppercase && !/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (PASSWORD_RULES.requireLowercase && !/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (PASSWORD_RULES.requireNumber && !/\d/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  if (PASSWORD_RULES.requireSpecial && ![...SPECIAL].some((c) => password.includes(c))) {
    return { valid: false, message: 'Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)' };
  }
  const result = zxcvbn(password);
  if (result.score < PASSWORD_RULES.minScore) {
    return { valid: false, message: result.feedback.warning || 'Password is too weak' };
  }
  return { valid: true };
}
