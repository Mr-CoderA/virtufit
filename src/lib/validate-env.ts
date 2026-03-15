/**
 * Call once at app startup (e.g. from instrumentation or first API load).
 * In production, require all vars and enforce lengths.
 */
export function validateEnv(): void {
  if (process.env.NODE_ENV !== 'production') return;

  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'JWT_ADMIN_SECRET',
    'REPLICATE_API_TOKEN',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'LEMONSQUEEZY_API_KEY',
    'LEMONSQUEEZY_WEBHOOK_SECRET',
    'LEMONSQUEEZY_STORE_ID',
    'LEMONSQUEEZY_VARIANT_ID',
  ];

  for (const key of required) {
    if (!process.env[key]) {
      // eslint-disable-next-line no-console
      console.error(`FATAL: Missing required env var: ${key}`);
      process.exit(1);
    }
  }

  const jwtSecret = process.env.JWT_SECRET!;
  const jwtAdmin = process.env.JWT_ADMIN_SECRET!;
  if (jwtSecret.length < 64) {
    // eslint-disable-next-line no-console
    console.error('FATAL: JWT_SECRET must be at least 64 characters');
    process.exit(1);
  }
  if (jwtAdmin.length < 64) {
    // eslint-disable-next-line no-console
    console.error('FATAL: JWT_ADMIN_SECRET must be at least 64 characters');
    process.exit(1);
  }
  if (jwtSecret === jwtAdmin) {
    // eslint-disable-next-line no-console
    console.error('FATAL: JWT_SECRET and JWT_ADMIN_SECRET must be different');
    process.exit(1);
  }

  const encKey = process.env.ENCRYPTION_KEY;
  if (encKey && !/^[a-f0-9]{64}$/i.test(encKey)) {
    // eslint-disable-next-line no-console
    console.error('FATAL: ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes) when set');
    process.exit(1);
  }
}
