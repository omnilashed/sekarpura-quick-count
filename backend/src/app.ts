import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import mongoose from 'mongoose';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { globalApiRateLimiter, postMutationRateLimiter } from './middlewares/rateLimiter.js';

export const createApp = (): Application => {
  const app = express();

  // Railway/Vercel berada di belakang reverse proxy: wajib agar rate limiter membaca IP asli klien
  app.set('trust proxy', 1);

  // Security Headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: false,
      frameguard: false, // Izinkan framing agar viewer presentasi dapat di-embed di iframe Vercel / domain frontend
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'", 'https:', 'data:', 'blob:'],
          frameAncestors: [
            "'self'",
            'https://sekarpura-quick-count.vercel.app',
            'https://*.vercel.app',
            'http://localhost:*',
            'http://127.0.0.1:*',
            '*',
          ],
          objectSrc: ["'self'", 'blob:', 'data:'],
          imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
        },
      },
    })
  );

  // CORS Configuration with strict origin check
  const isAllowedOrigin = (origin?: string): boolean => {
    if (!origin) return true; // allow same-origin, curl, server-to-server, mobile
    const cleanOrigin = origin.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
    const cleanCorsEnv = (env.CORS_ORIGIN || '').replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();

    if (origin === env.CORS_ORIGIN || cleanOrigin === cleanCorsEnv) return true;
    if (origin.endsWith('.vercel.app') || origin.endsWith('.netlify.app') || origin.endsWith('.railway.app')) return true;
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) return true;
    return false;
  };

  app.use(
    cors({
      origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`Akses diblokir oleh kebijakan CORS untuk origin: ${origin}`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // Global Rate Limiting across all API routes
  app.use('/api', globalApiRateLimiter);

  // Rate Limiting strictly for all state-changing requests (POST, PUT, PATCH, DELETE)
  app.use('/api', postMutationRateLimiter);

  // Body Parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // Static uploads directory with CORS headers
  app.use(
    '/uploads',
    (req, res, next) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      next();
    },
    express.static(env.UPLOAD_DIR)
  );

  // Root health & ping endpoint (prevents default 404 & framing errors on root domain)
  app.get('/', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'UP',
      app: 'SEKARPURA Election Center API',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED',
    });
  });

  // SVG logo endpoint directly on backend root
  app.get('/logo.svg', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="#0284c7"><circle cx="50" cy="50" r="46" fill="#0B1630" stroke="#0284c7" stroke-width="4"/><text x="50" y="58" font-family="sans-serif" font-size="28" font-weight="bold" fill="#38bdf8" text-anchor="middle">SP</text></svg>`
    );
  });

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'UP',
      app: 'SEKARPURA Election Center API',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED',
    });
  });

  // Mount API Routes
  app.use('/api', routes);

  // Central Error Handler
  app.use(errorHandler);

  return app;
};
