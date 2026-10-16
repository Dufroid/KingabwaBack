"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadToCloudinary = exports.buildLocalUploadResponse = exports.isCloudinaryConfigured = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const cloudinary_1 = require("cloudinary");
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});
exports.isCloudinaryConfigured = Boolean(process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET);
const buildSafeFileName = (fileName) => {
    const safeName = (fileName || 'upload')
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9._-]/g, '');
    const extension = path_1.default.extname(safeName) || '.jpg';
    const baseName = path_1.default.basename(safeName, extension).slice(0, 40) || 'upload';
    return `${Date.now()}-${baseName}${extension}`;
};
const buildLocalUploadResponse = (file, folderName) => {
    const uploadDir = path_1.default.join(process.cwd(), 'uploads', folderName);
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
    const fileName = buildSafeFileName(file.originalname || 'upload');
    const filePath = path_1.default.join(uploadDir, fileName);
    fs_1.default.writeFileSync(filePath, file.buffer);
    const baseUrl = (process.env.UPLOADS_BASE_URL || `http://localhost:${process.env.PORT || 5000}`).replace(/\/$/, '');
    const relativePath = `/uploads/${folderName}/${fileName}`;
    return {
        url: `${baseUrl}${relativePath}`,
        relativePath,
        fileName,
    };
};
exports.buildLocalUploadResponse = buildLocalUploadResponse;
const uploadToCloudinary = async (file, folderName) => {
    if (!exports.isCloudinaryConfigured) {
        throw new Error('Cloudinary n\'est pas configuré. Vérifie CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY et CLOUDINARY_API_SECRET.');
    }
    const publicId = `${folderName.replace(/\//g, '-')}-${Date.now()}`;
    return new Promise((resolve, reject) => {
        cloudinary_1.v2.uploader.upload_stream({
            folder: folderName,
            public_id: publicId,
            resource_type: 'image',
        }, (error, result) => {
            if (error || !result?.secure_url) {
                reject(error || new Error('Cloudinary upload failed'));
                return;
            }
            resolve({
                url: result.secure_url,
                publicId: result.public_id || publicId,
            });
        }).end(file.buffer);
    });
};
exports.uploadToCloudinary = uploadToCloudinary;
