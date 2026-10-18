// Keep two images plus multipart framing below Vercel's 4.5 MB request limit.
export async function prepareImage(blob: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' });
  try {
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d'); if (!context) throw new Error('Image processing is unavailable in this browser.');
    context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.93, 0.85, 0.72]) {
      const output = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
      if (output && output.size <= 1_800_000) return output;
    }
    throw new Error('This photo is too detailed. Choose a smaller image.');
  } finally { bitmap.close(); }
}
