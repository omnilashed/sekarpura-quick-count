import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { env } from '../config/env.js';

// Ensure upload directories exist
const photosDir = path.join(env.UPLOAD_DIR, 'photos');
const presentationsDir = path.join(env.UPLOAD_DIR, 'presentations');
const convertedDir = path.join(env.UPLOAD_DIR, 'converted');
const thumbnailsDir = path.join(env.UPLOAD_DIR, 'thumbnails');

[photosDir, presentationsDir, convertedDir, thumbnailsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Photo upload storage
const photoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, photosDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `candidate-${uniqueSuffix}${ext}`);
  },
});

export const uploadPhoto = multer({
  storage: photoStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file gambar (JPG, PNG, WebP) yang diizinkan.'));
    }
  },
});

// Presentation upload storage
const presentationStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, presentationsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `pres-${uniqueSuffix}${ext}`);
  },
});

export const uploadPresentation = multer({
  storage: presentationStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (_req, file, cb) => {
    const allowedExtensions = ['.pdf', '.ppt', '.pptx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Format file tidak didukung. Harap unggah file .pdf, .ppt, atau .pptx.'));
    }
  },
});
