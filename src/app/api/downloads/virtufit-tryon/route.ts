import { NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs';
import { PassThrough } from 'node:stream';
import archiver from 'archiver';

const PLUGIN_DIR = 'virtufit-tryon';
const FILES = ['virtufit-tryon.php', 'readme.txt'] as const;

/**
 * GET /api/downloads/virtufit-tryon
 * Serves the VirtuFit Try-On WordPress plugin as a zip so users can download and upload in WordPress.
 */
export async function GET() {
  const base = path.join(process.cwd(), '..', 'integrations', 'wordpress', PLUGIN_DIR);
  const altBase = path.join(process.cwd(), 'integrations', 'wordpress', PLUGIN_DIR);
  const dir = fs.existsSync(base) ? base : fs.existsSync(altBase) ? altBase : null;

  if (!dir) {
    return NextResponse.json({ error: 'Plugin files not found' }, { status: 404 });
  }

  const archive = archiver('zip', { zlib: { level: 9 } });
  const pass = new PassThrough();
  const chunks: Buffer[] = [];
  pass.on('data', (chunk: Buffer) => chunks.push(chunk));

  const body = await new Promise<Buffer>((resolve, reject) => {
    pass.on('end', () => resolve(Buffer.concat(chunks)));
    pass.on('error', reject);
    archive.on('error', reject);

    archive.pipe(pass);

    for (const file of FILES) {
      const filePath = path.join(dir, file);
      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: `${PLUGIN_DIR}/${file}` });
      }
    }
    void archive.finalize();
  });

  return new NextResponse(new Uint8Array(body), {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="virtufit-tryon.zip"',
      'Content-Length': String(body.length),
    },
  });
}
