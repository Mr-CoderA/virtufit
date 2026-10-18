import { test } from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { prepareProviderImage } from '../../src/lib/try-on-images';
import { TryOnError } from '../../src/lib/try-on-policy';
test('server decodes, resizes and strips image metadata before provider upload', async () => {
  const bytes = await sharp({ create: { width: 2000, height: 500, channels: 3, background: '#225588' } }).withMetadata().png().toBuffer();
  const image = await prepareProviderImage(new File([new Uint8Array(bytes)], 'photo.png', { type: 'image/png' }), 'person');
  assert.equal(image.type, 'image/jpeg');
  const output = await sharp(Buffer.from(await image.arrayBuffer())).metadata();
  assert.equal(output.width, 1600); assert.equal(output.height, 400); assert.equal(output.exif, undefined);
});
test('server rejects disguised and invalid image payloads before billing', async () => {
  const svg = new File(['<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"></svg>'], 'fake.png', { type: 'image/png' });
  for (const input of [svg, new File(['not a photo'], 'fake.jpg', { type: 'image/jpeg' }), new File([new Uint8Array(1_800_001)], 'big.png', { type: 'image/png' }), null]) {
    await assert.rejects(prepareProviderImage(input, 'person'), TryOnError);
  }
});
