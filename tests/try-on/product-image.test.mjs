import { test } from 'node:test';
import assert from 'node:assert/strict';
import { productPrompt, productFraming, validateProductFile } from '../../src/components/fitting-room/product-image.mjs';
test('dress and outfit prompts replace the correct garments', () => {
  assert.match(productPrompt('dress'), /current top and bottoms.*dress/);
  assert.match(productPrompt('outfit'), /including top and bottoms/);
  assert.match(productPrompt('bottoms'), /Keep the current top unchanged/);
  assert.match(productPrompt('top'), /Keep the current bottoms unchanged/);
  assert.match(productPrompt('kurta'), /length, neckline and embroidery/);
  assert.match(productPrompt('auto'), /corresponding clothing/);
});
test('optional details are included and framing changes with garment type', () => {
  assert.match(productPrompt('top', '  olive linen  '), /Additional garment details: olive linen$/);
  assert.match(productFraming('dress'), /full outfit/);
  assert.match(productFraming('top'), /upper body/);
});
test('unsupported, empty and oversized product images are rejected', () => {
  assert.ok(validateProductFile({ type: 'image/svg+xml', size: 100 }));
  assert.ok(validateProductFile({ type: 'image/png', size: 0 }));
  assert.ok(validateProductFile({ type: 'image/jpeg', size: 13 * 1024 * 1024 }));
  assert.equal(validateProductFile({ type: 'image/webp', size: 1000 }), '');
});
