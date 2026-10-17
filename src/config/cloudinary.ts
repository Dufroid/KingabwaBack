import fs from 'fs';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
);

const buildSafeFileName = (fileName: string) => {
  const safeName = (fileName || 'upload')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9._-]/g, '');

  const extension = path.extname(safeName) || '.jpg';
  const baseName = path.basename(safeName, extension).slice(0, 40) || 'upload';
  return `${Date.now()}-${baseName}${extension}`;
};

export const buildLocalUploadResponse = (file: Express.Multer.File, folderName: string) => {
  const uploadDir = path.join(process.cwd(), 'uploads', folderName);
  fs.mkdirSync(uploadDir, { recursive: true });

  const fileName = buildSafeFileName(file.originalname || 'upload');
  const filePath = path.join(uploadDir, fileName);
  fs.writeFileSync(filePath, file.buffer);

  const baseUrl = (process.env.UPLOADS_BASE_URL || `http://localhost:${process.env.PORT || 5000}`).replace(/\/$/, '');
  const relativePath = `/uploads/${folderName}/${fileName}`;

  return {
    url: `${baseUrl}${relativePath}`,
    relativePath,
    fileName,
  };
};

export const uploadToCloudinary = async (file: Express.Multer.File, folderName: string, resourceType: 'image' | 'video' | 'raw' = 'image') => {
  if (!isCloudinaryConfigured) {
    throw new Error('Cloudinary n\'est pas configuré. Vérifie CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY et CLOUDINARY_API_SECRET.');
  }

  const publicId = `${folderName.replace(/\//g, '-')}-${Date.now()}`;

  return new Promise<{ url: string; publicId: string }>((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: folderName,
        public_id: publicId,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error || !result?.secure_url) {
          reject(error || new Error('Cloudinary upload failed'));
          return;
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id || publicId,
        });
      }
    ).end(file.buffer);
  });
};
