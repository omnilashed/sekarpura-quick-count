import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { env } from './env.js';

const currentDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();

let mongodInstance: any = null;

export const connectDB = async (): Promise<void> => {
  const isLocalUri =
    env.MONGODB_URI.includes('127.0.0.1') || env.MONGODB_URI.includes('localhost');

  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      autoIndex: true,
      serverSelectionTimeoutMS: isLocalUri ? 2500 : 10000,
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error: any) {
    if (
      env.NODE_ENV !== 'production' &&
      isLocalUri &&
      (error.name === 'MongooseServerSelectionError' ||
        error.message?.includes('ECONNREFUSED') ||
        error.message?.includes('connect ECONNREFUSED'))
    ) {
      console.log('[Database] MongoDB lokal eksternal tidak aktif di port 27017.');
      console.log('[Database] Mengaktifkan embedded MongoDB lokal persisten...');

      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        const dbPath = path.resolve(currentDir, '../../../.mongo-data');
        if (!fs.existsSync(dbPath)) {
          fs.mkdirSync(dbPath, { recursive: true });
        }

        mongodInstance = await MongoMemoryServer.create({
          instance: {
            port: 27017,
            dbName: 'sekarpura_election',
            dbPath,
          },
        });

        const localUri = mongodInstance.getUri();
        const targetUri = env.MONGODB_URI.startsWith('mongodb://')
          ? env.MONGODB_URI
          : `${localUri}sekarpura_election`;
        console.log(`[Database] Menghubungkan ke database: ${targetUri}`);

        const conn = await mongoose.connect(targetUri, {
          autoIndex: true,
        });
        console.log(`[Database] Terhubung ke MongoDB: ${conn.connection.host}/${conn.connection.name}`);

        const cleanup = async () => {
          if (mongodInstance) {
            console.log('[Database] Menghentikan MongoDB lokal...');
            await mongodInstance.stop();
          }
          await mongoose.disconnect();
          process.exit(0);
        };

        process.on('SIGINT', cleanup);
        process.on('SIGTERM', cleanup);
        return;
      } catch (memError) {
        console.error('[Database] Gagal mengaktifkan embedded MongoDB lokal:', memError);
        process.exit(1);
      }
    }

    console.error('[Database] MongoDB Connection Error:', error);
    process.exit(1);
  }
};
