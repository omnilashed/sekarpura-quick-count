import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { env } from '../config/env.js';
import { Presentation } from '../models/Presentation.js';
import { GridFSService } from '../services/gridfs.service.js';
import { validateMagicBytes } from '../services/presentation.service.js';

async function migrate() {
  console.log('--- Memulai Migrasi Presentasi Legacy ke GridFS ---');
  await mongoose.connect(env.MONGODB_URI);

  const presentations = await Presentation.find({});
  console.log(`Ditemukan ${presentations.length} dokumen presentasi di database.`);

  let migratedCount = 0;
  let reuploadNeededCount = 0;
  let alreadyGridFSCount = 0;

  for (const pres of presentations) {
    if (pres.gridFsFileId) {
      // Periksa apakah file benar-benar ada di GridFS
      const fileInfo = await GridFSService.getFileInfo(pres.gridFsFileId);
      if (fileInfo) {
        alreadyGridFSCount++;
        continue;
      }
    }

    // Cek apakah ada file legacy di disk
    let legacyFilePath: string | null = null;
    if (pres.originalFileKey) {
      const candidatePath = path.resolve(env.UPLOAD_DIR, pres.originalFileKey);
      if (fs.existsSync(candidatePath)) {
        legacyFilePath = candidatePath;
      }
    }

    if (!legacyFilePath && pres.originalFileName) {
      const candidatePath = path.resolve(env.UPLOAD_DIR, 'presentations', pres.originalFileName);
      if (fs.existsSync(candidatePath)) {
        legacyFilePath = candidatePath;
      }
    }

    if (legacyFilePath && fs.existsSync(legacyFilePath)) {
      try {
        const fileBuffer = fs.readFileSync(legacyFilePath);
        const detected = validateMagicBytes(fileBuffer) || {
          ext: pres.fileType || 'pdf',
          mime: pres.fileType === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        };

        const uploadRes = await GridFSService.uploadBuffer(
          pres.originalFileName || path.basename(legacyFilePath),
          fileBuffer,
          detected.mime,
          {
            migratedFrom: legacyFilePath,
            candidateId: pres.candidateId,
          }
        );

        pres.gridFsFileId = uploadRes.fileId;
        pres.storageKey = uploadRes.storageKey;
        pres.sha256 = uploadRes.sha256;
        pres.fileSize = uploadRes.size;
        pres.mimeType = detected.mime;
        if (pres.fileType === 'pdf') {
          pres.previewGridFsFileId = uploadRes.fileId;
          pres.conversionStatus = 'COMPLETED';
        } else {
          pres.conversionStatus = 'READY';
        }
        pres.conversionError = undefined;
        await pres.save();

        console.log(`[SUKSES] Presentasi ${pres._id} (${pres.originalFileName}) berhasil dipindahkan ke GridFS.`);
        migratedCount++;
      } catch (err: any) {
        console.error(`[GAGAL] Migrasi gagal untuk presentasi ${pres._id}:`, err.message);
      }
    } else {
      // File fisik tidak ada di disk
      pres.conversionStatus = 'FAILED';
      pres.conversionError =
        'File biner fisik tidak ditemukan di server lokal. Harap lakukan unggah ulang materi presentasi Anda.';
      await pres.save();
      console.warn(
        `[PERHATIAN] Presentasi ${pres._id} (${pres.originalFileName}): File fisik hilang dari disk. Ditandai untuk unggah ulang.`
      );
      reuploadNeededCount++;
    }
  }

  console.log('--- Ringkasan Migrasi ---');
  console.log(`Sudah di GridFS   : ${alreadyGridFSCount}`);
  console.log(`Berhasil Dimigrasi: ${migratedCount}`);
  console.log(`Perlu Upload Ulang: ${reuploadNeededCount}`);
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error('Fatal error saat migrasi:', err);
  process.exit(1);
});
