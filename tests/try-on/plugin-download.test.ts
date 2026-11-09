import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

// The route reads plugin files relative to process.cwd(). Each test file runs
// in its own process under `node --test`, so changing cwd here is isolated.
const root = mkdtempSync(path.join(tmpdir(), 'virtufit-plugin-'));
const original = process.cwd();

test.after(() => { process.chdir(original); rmSync(root, { recursive: true, force: true }); });

test('returns 404 when the plugin files are absent', async () => {
  process.chdir(root);
  const { GET } = await import('../../src/app/api/downloads/virtufit-tryon/route');
  const res = await GET();
  assert.equal(res.status, 404);
});

test('zips the plugin files under the plugin folder', async () => {
  const dir = path.join(root, 'integrations/wordpress/virtufit-tryon');
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, 'virtufit-tryon.php'), '<?php // fixture');
  writeFileSync(path.join(dir, 'readme.txt'), 'fixture readme');
  process.chdir(root);
  const { GET } = await import('../../src/app/api/downloads/virtufit-tryon/route');
  const res = await GET();
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type'), 'application/zip');
  const body = Buffer.from(await res.arrayBuffer());
  assert.equal(body.subarray(0, 4).toString('hex'), '504b0304', 'zip local file header');
  assert.equal(res.headers.get('content-length'), String(body.length));
  const text = body.toString('latin1');
  assert.ok(text.includes('virtufit-tryon/virtufit-tryon.php'));
  assert.ok(text.includes('virtufit-tryon/readme.txt'));
});
