import { v2 as cloudinary } from 'cloudinary';

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

if (CLOUD_NAME && API_KEY && API_SECRET) {
  cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: API_KEY,
    api_secret: API_SECRET,
  });
}

/**
 * Upload a buffer to Cloudinary as a temp try-on input (tagged for auto-cleanup).
 * Returns the secure_url.
 */
export function uploadTempImage(buffer: Buffer, folder: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
      reject(new Error('Cloudinary is not configured'));
      return;
    }

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `tryon/${folder}`,
        resource_type: 'image' as const,
        tags: ['temp', 'tryon-input'],
      },
      (error, result) => {
        if (error) reject(error);
        else if (result?.secure_url) resolve(result.secure_url);
        else reject(new Error('No URL returned from Cloudinary'));
      }
    );
    stream.end(buffer);
  });
}

export { cloudinary };
