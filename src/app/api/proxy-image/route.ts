import { NextResponse } from 'next/server';

const ALLOWED_HOSTS = [
  'replicate.delivery',
  'pb.replicate.delivery',
  'res.cloudinary.com',
];

function isAllowedImageUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    if (!['http:', 'https:'].includes(url.protocol)) return false;
    const host = url.hostname.toLowerCase();
    return ALLOWED_HOSTS.some((allowed) => host === allowed || host.endsWith('.' + allowed));
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  if (!url || !isAllowedImageUrl(url)) {
    return NextResponse.json({ error: 'Invalid or disallowed URL' }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'VirtuFit-Proxy/1.0' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      return NextResponse.json({ error: 'Upstream image failed' }, { status: 502 });
    }
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const blob = await res.blob();
    return new NextResponse(blob, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (err) {
    console.warn('[proxy-image] Fetch error:', (err as Error).message);
    return NextResponse.json({ error: 'Failed to load image' }, { status: 502 });
  }
}
