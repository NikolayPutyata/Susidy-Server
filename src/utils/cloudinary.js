import { v2 as cloudinary } from 'cloudinary';
import { getEnvVar } from './getEnvVar.js';

let configured = false;

const ensureConfigured = () => {
  if (!configured) {
    cloudinary.config({
      cloud_name: getEnvVar('CLOUDINARY_CLOUD_NAME'),
      api_key: getEnvVar('CLOUDINARY_API_KEY'),
      api_secret: getEnvVar('CLOUDINARY_API_SECRET'),
    });
    configured = true;
  }
};

const uploadImageBuffer = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'susidy-products',
        // Stored originals are capped at 1600px on the longer side (never
        // upscaled) — the site never shows anything wider, and phone photos
        // straight from the camera are often 4000px+ and several MB. The
        // client then requests smaller WebP/AVIF variants on the fly
        // (f_auto,q_auto,w_… in the URL), see src/lib/images.js there.
        transformation: [{ width: 1600, height: 1600, crop: 'limit' }],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      },
    );
    stream.end(buffer);
  });

export const uploadImages = async (files = []) => {
  ensureConfigured();
  return Promise.all(files.map((file) => uploadImageBuffer(file.buffer)));
};
