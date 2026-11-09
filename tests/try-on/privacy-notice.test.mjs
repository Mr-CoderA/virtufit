import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

test('privacy notice states what is sent, how Decart may use it, and upload rights', () => {
  const notice = read('src/components/PrivacyNotice.tsx');
  assert.match(notice, /photos and generated results are sent to Decart for processing/);
  assert.match(notice, /Decart may use them to improve its platform/);
  assert.match(notice, /Only upload photos you have the right to use/);
  assert.match(notice, /'https:\/\/decart\.ai\/terms'/);
  assert.match(notice, /href="\/privacy"/);
});

test('notice appears before each upload control', () => {
  for (const [file, upload] of [
    ['src/components/fitting-room/PhotoTryOn.tsx', 'person-upload'],
    ['src/components/fitting-room/UploadDialog.tsx', 'upload-drop'],
  ]) {
    const source = read(file);
    const notice = source.indexOf('<PrivacyNotice');
    assert.ok(notice > -1, `${file} renders the notice`);
    assert.ok(notice < source.indexOf(upload), `${file} shows the notice before the upload control`);
  }
});

test('live consent and the privacy page link Decart terms', () => {
  assert.match(read('src/components/fitting-room/FittingRoom.tsx'), /href=\{DECART_TERMS_URL\}/);
  const page = read('src/app/privacy/page.tsx');
  assert.match(page, /href=\{DECART_TERMS_URL\}/);
  assert.match(page, /Only upload photos you have the right to use/);
  assert.doesNotMatch(page, /\b\d+\s*(days?|months?|years?)\b/, 'no retention periods are stated');
  assert.match(read('src/components/SiteFooter.tsx'), /href="\/privacy"/);
});
