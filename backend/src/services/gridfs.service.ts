import mongoose from 'mongoose';
import crypto from 'crypto';
import { Readable } from 'stream';

let presentationBucket: mongoose.mongo.GridFSBucket | null = null;
let photoBucket: mongoose.mongo.GridFSBucket | null = null;

export class GridFSService {
  /**
   * Mendapatkan instance GridFSBucket untuk koleksi foto profil kandidat (Permanen di Atlas)
   */
  static getPhotoBucket(): mongoose.mongo.GridFSBucket {
    if (!mongoose.connection.db) {
      throw new Error('Koneksi database MongoDB belum siap.');
    }
    if (!photoBucket) {
      photoBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        bucketName: 'candidate_photos',
      });
    }
    return photoBucket;
  }

  /**
   * Simpan foto profil ke GridFS (Persisten, anti-hilang saat container restart)
   */
  static async uploadPhotoBuffer(
    originalFileName: string,
    buffer: Buffer,
    mimeType: string,
    metadata: Record<string, any> = {}
  ): Promise<{ fileId: mongoose.Types.ObjectId; sha256: string; size: number; storageKey: string }> {
    const bucket = this.getPhotoBucket();
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
    const uniqueId = new mongoose.Types.ObjectId().toString();
    const ext = originalFileName.includes('.') ? originalFileName.split('.').pop() : 'jpg';
    const storageKey = `photo-${uniqueId}.${ext}`;

    return new Promise((resolve, reject) => {
      const uploadStream = bucket.openUploadStream(storageKey, {
        contentType: mimeType,
        metadata: {
          ...metadata,
          originalFileName,
          sha256,
          uploadedAt: new Date(),
        },
      });

      const readable = new Readable();
      readable.push(buffer);
      readable.push(null);

      uploadStream.on('error', (err) => reject(err));
      uploadStream.on('finish', () => {
        resolve({
          fileId: uploadStream.id as mongoose.Types.ObjectId,
          sha256,
          size: buffer.length,
          storageKey,
        });
      });

      readable.pipe(uploadStream);
    });
  }

  static openPhotoDownloadStream(fileId: mongoose.Types.ObjectId): mongoose.mongo.GridFSBucketReadStream {
    const bucket = this.getPhotoBucket();
    return bucket.openDownloadStream(fileId);
  }

  static async getPhotoFileInfo(fileId: mongoose.Types.ObjectId): Promise<any> {
    const bucket = this.getPhotoBucket();
    const files = await bucket.find({ _id: fileId }).toArray();
    return files[0] || null;
  }

  static async deletePhoto(fileId: mongoose.Types.ObjectId): Promise<void> {
    const bucket = this.getPhotoBucket();
    try {
      await bucket.delete(fileId);
    } catch {
      // ignore
    }
  }

  /**
   * Mendapatkan instance GridFSBucket untuk koleksi presentasi
   */
  static getBucket(): mongoose.mongo.GridFSBucket {
    if (!mongoose.connection.db) {
      throw new Error('Koneksi database MongoDB belum siap.');
    }
    if (!presentationBucket) {
      presentationBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        bucketName: 'presentations',
      });
    }
    return presentationBucket;
  }

  /**
   * Menyimpan buffer file asli ke dalam GridFS tanpa mengubah isi file sedikit pun.
   * Menghitung hash SHA-256 secara bersamaan untuk jaminan integritas byte-level.
   */
  static async uploadBuffer(
    originalFileName: string,
    buffer: Buffer,
    mimeType: string,
    metadata: Record<string, any> = {}
  ): Promise<{ fileId: mongoose.Types.ObjectId; sha256: string; size: number; storageKey: string }> {
    const bucket = this.getBucket();

    // Hitung SHA-256 dari buffer asli
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');

    // Buat nama internal unik (UUID / ObjectId)
    const uniqueId = new mongoose.Types.ObjectId().toString();
    const sanitizedName = originalFileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storageKey = `${uniqueId}-${sanitizedName}`;

    return new Promise((resolve, reject) => {
      const uploadStream = bucket.openUploadStream(storageKey, {
        contentType: mimeType,
        metadata: {
          ...metadata,
          originalFileName,
          sha256,
          uploadedAt: new Date(),
        },
      });

      const readable = new Readable();
      readable.push(buffer);
      readable.push(null); // End of stream

      uploadStream.on('error', (err) => reject(err));
      uploadStream.on('finish', () => {
        resolve({
          fileId: uploadStream.id as mongoose.Types.ObjectId,
          sha256,
          size: buffer.length,
          storageKey,
        });
      });

      readable.pipe(uploadStream);
    });
  }

  /**
   * Membuka stream baca dari GridFS berdasarkan fileId
   */
  static openDownloadStream(fileId: mongoose.Types.ObjectId): mongoose.mongo.GridFSBucketReadStream {
    const bucket = this.getBucket();
    return bucket.openDownloadStream(fileId);
  }

  /**
   * Mengambil seluruh isi file GridFS ke dalam Buffer memori (berguna untuk verifikasi hash)
   */
  static async getFileBuffer(fileId: mongoose.Types.ObjectId): Promise<Buffer> {
    const stream = this.openDownloadStream(fileId);
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on('error', (err) => reject(err));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }

  /**
   * Mengambil metadata file dari fs.files
   */
  static async getFileInfo(fileId: mongoose.Types.ObjectId): Promise<any> {
    const bucket = this.getBucket();
    const files = await bucket.find({ _id: fileId }).toArray();
    return files[0] || null;
  }

  /**
   * Menghapus file dan seluruh chunks-nya dari GridFS
   */
  static async deleteFile(fileId: mongoose.Types.ObjectId): Promise<void> {
    try {
      const bucket = this.getBucket();
      await bucket.delete(fileId);
    } catch (err: any) {
      console.warn(`[GridFS] Gagal menghapus file ${fileId}:`, err.message);
    }
  }
}
