import sharp from 'sharp';
import { TryOnError } from './try-on-policy';
export async function prepareProviderImage(value: FormDataEntryValue | null, name: string) {
  if (!(value instanceof Blob) || !['image/png', 'image/jpeg', 'image/webp'].includes(value.type) || !value.size || value.size > 1_800_000) throw new TryOnError(`Choose a valid ${name} image. Use the app to resize large photos.`);
  try {
    const input = sharp(Buffer.from(await value.arrayBuffer()), { limitInputPixels: 25_000_000, animated: false });
    const metadata = await input.metadata();
    const format = { 'image/png': 'png', 'image/jpeg': 'jpeg', 'image/webp': 'webp' }[value.type];
    if (metadata.format !== format) throw new Error('Image format mismatch');
    const bytes = await input.rotate().resize(1600, 1600, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 92 }).toBuffer();
    return new Blob([new Uint8Array(bytes)], { type: 'image/jpeg' });
  } catch { throw new TryOnError(`The ${name} image could not be opened.`); }
}
