import { Request, Response } from 'express';
import { rateLimit } from 'express-rate-limit';

/**
 * Strict rate limiter for Authentication (Login, Change Password, etc.)
 * Prevents brute-force credential attacks.
 * Limit: 10 attempts per 15 minutes per IP.
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Terlalu banyak percobaan login dari IP ini. Silakan coba kembali dalam 15 menit.',
  },
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Terlalu banyak percobaan login dari IP ini. Silakan coba kembali dalam 15 menit.',
    });
  },
});

/**
 * Rate limiter applied to all data modification requests (POST, PUT, PATCH, DELETE).
 * Protects server resources, database writes, and prevents spam/DoS on mutations.
 * Limit: 250 mutating requests per 15 minutes per IP.
 */
export const postMutationRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 250,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    // Only apply to state-changing methods
    return !['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
  },
  message: {
    success: false,
    message: 'Terlalu banyak permintaan pengiriman data (POST/PUT/DELETE). Silakan coba beberapa saat lagi.',
  },
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Terlalu banyak permintaan pengiriman data (POST/PUT/DELETE). Silakan coba beberapa saat lagi.',
    });
  },
});

/**
 * Strict rate limiter for file upload endpoints (Photos & Presentations).
 * Prevents storage exhaustion and memory spikes.
 * Limit: 30 uploads per 15 minutes per IP.
 */
export const uploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Terlalu banyak permintaan unggah file. Silakan tunggu beberapa saat sebelum mengunggah kembali.',
  },
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Terlalu banyak permintaan unggah file. Silakan tunggu beberapa saat sebelum mengunggah kembali.',
    });
  },
});

/**
 * General API read limiter for GET requests
 */
export const globalApiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Terlalu banyak permintaan ke server. Silakan coba beberapa saat lagi.',
  },
});
