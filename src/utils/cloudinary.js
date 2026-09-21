import { v2 as cloudinary } from 'cloudinary';
import { getEnvVar } from './getEnvVar.js';

cloudinary.config({
  cloud_name: getEnvVar('CLOUDINARY_CLOUD_NAME'),
  api_key: getEnvVar('CLOUDINARY_API_KEY'),
  api_secret: getEnvVar('CLOUDINARY_API_SECRET'),
});

const uploadImageBuffer = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'susidy-products' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      },
    );
    stream.end(buffer);
  });

export const uploadImages = async (files = []) => {
  return Promise.all(files.map((file) => uploadImageBuffer(file.buffer)));
};
