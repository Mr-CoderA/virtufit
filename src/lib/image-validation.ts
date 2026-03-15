import sharp from 'sharp';
import { logger } from '@/lib/logger';

const JPEG_SIG = Buffer.from([0xff, 0xd8, 0xff]);
const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const WEBP_SIG = Buffer.from([0x52, 0x49, 0x46, 0x46]); // RIFF
const WEBP_SUB = Buffer.from([0x57, 0x45, 0x42, 0x50]); // WEBP at offset 8

const MIN_DIM = 100;
const MAX_DIM = 8000;

function bufferStartsWith(buf: Buffer, prefix: Buffer): boolean {
  return buf.length >= prefix.length && prefix.every((b, i) => buf[i] === b);
}

function getExpectedSignature(mime: string): Buffer | null {
  if (mime === 'image/jpeg') return JPEG_SIG;
  if (mime === 'image/png') return PNG_SIG;
  if (mime === 'image/webp') return WEBP_SIG;
  return null;
}

function verifyMagicBytes(buffer: Buffer, mime: string): boolean {
  const sig = getExpectedSignature(mime);
  if (!sig) return false;
  if (mime === 'image/webp') {
    return buffer.length >= 12 && bufferStartsWith(buffer, WEBP_SIG) && bufferStartsWith(buffer.slice(8), WEBP_SUB);
  }
  return bufferStartsWith(buffer, sig);
}

export async function validateAndCleanImage(
  buffer: Buffer,
  declaredMime: string,
  ip?: string
): Promise<{ ok: true; buffer: Buffer } | { ok: false; error: string }> {
  if (!verifyMagicBytes(buffer, declaredMime)) {
    logger.security('Suspicious file upload: magic bytes mismatch', { ip, mime: declaredMime });
    return { ok: false, error: 'File content does not match declared type' };
  }

  try {
    const meta = await sharp(buffer).metadata();
    const w = meta.width ?? 0;
    const h = meta.height ?? 0;
    if (w < MIN_DIM || h < MIN_DIM) {
      return { ok: false, error: `Image too small (min ${MIN_DIM}x${MIN_DIM}px)` };
    }
    if (w > MAX_DIM || h > MAX_DIM) {
      return { ok: false, error: `Image too large (max ${MAX_DIM}x${MAX_DIM}px)` };
    }
    const cleaned = await sharp(buffer).rotate().toBuffer();
    return { ok: true, buffer: cleaned };
  } catch (e) {
    return { ok: false, error: 'Invalid or corrupted image' };
  }
}

export function getMimeFromFilename(_filename: string): string {
  return 'image/jpeg';
}
