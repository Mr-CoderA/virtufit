import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com https://assets.lemonsqueezy.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://res.cloudinary.com https://*.replicate.delivery https://*.trycloudflare.com",
  "connect-src 'self' https://virtufit.xyz https://www.virtufit.xyz https://api.replicate.com https://api.lemonsqueezy.com https://api.cloudinary.com https://*.decart.ai wss://*.decart.ai https://*.livekit.cloud wss://*.livekit.cloud",
  "worker-src 'self' blob:",
  "media-src 'self' blob:",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

export function proxy(request: NextRequest) {
  const res = NextResponse.next();
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-XSS-Protection', '1; mode=block');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'camera=(self), microphone=(), geolocation=(), payment=()');
  // Webpack's local refresh runtime uses eval; keep it out of production.
  const policy = process.env.NODE_ENV === 'development'
    ? CSP.replace("'wasm-unsafe-eval'", "'wasm-unsafe-eval' 'unsafe-eval'").replace("connect-src 'self'", "connect-src 'self' ws://localhost:* ws://127.0.0.1:*")
    : CSP;
  res.headers.set('Content-Security-Policy', policy);
  if (request.nextUrl.protocol === 'https:') {
    res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
