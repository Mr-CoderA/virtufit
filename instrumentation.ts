/**
 * Next.js instrumentation — runs when the Node.js runtime loads.
 * Validates required env vars in production before serving requests.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateEnv } = await import('./src/lib/validate-env');
    validateEnv();
  }
}
