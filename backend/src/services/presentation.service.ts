import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';
import JSZip from 'jszip';
import { Presentation, IPresentation, ISlideData } from '../models/Presentation.js';
import { GridFSService } from './gridfs.service.js';

const execFileAsync = promisify(execFile);

/**
 * Validasi magic bytes untuk memastikan tipe file sebenarnya sesuai format biner
 */
export function validateMagicBytes(
  buffer: Buffer
): { ext: 'pdf' | 'ppt' | 'pptx'; mime: string } | null {
  if (!buffer || buffer.length < 4) return null;

  // PDF: %PDF- (0x25 0x50 0x44 0x46)
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return { ext: 'pdf', mime: 'application/pdf' };
  }

  // PPTX: ZIP PK\x03\x04 (0x50 0x4B 0x03 0x04)
  if (buffer[0] === 0x50 && buffer[1] === 0x4B && buffer[2] === 0x03 && buffer[3] === 0x04) {
    return {
      ext: 'pptx',
      mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    };
  }

  // PPT (Legacy MS Compound OLE): 0xD0 0xCF 0x11 0xE0
  if (buffer[0] === 0xd0 && buffer[1] === 0xcf && buffer[2] === 0x11 && buffer[3] === 0xe0) {
    return { ext: 'ppt', mime: 'application/vnd.ms-powerpoint' };
  }

  return null;
}

export class PresentationService {
  /**
   * Menemukan path binary LibreOffice (soffice) di sistem jika terpasang
   */
  static findLibreOfficePath(): string | null {
    const candidates = [
      'soffice',
      'libreoffice',
      '/usr/bin/soffice',
      '/usr/bin/libreoffice',
      'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
      'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
    ];

    for (const bin of candidates) {
      if (path.isAbsolute(bin)) {
        if (fs.existsSync(bin)) return bin;
      }
    }
    return null;
  }

  /**
   * Memproses presentasi secara non-destruktif:
   * - Menjaga file asli di GridFS 100% tanpa ubahan apa pun
   * - Untuk PDF: preview langsung merujuk ke file asli
   * - Untuk PPTX/PPT: jika LibreOffice tersedia, hasilkan preview PDF sebagai artefak terpisah
   * - Ekstraksi teks & ringkasan slide secara non-destruktif untuk keperluan metadata
   */
  static async processPresentation(presentationId: string): Promise<IPresentation> {
    const presentation = await Presentation.findById(presentationId);
    if (!presentation) {
      throw new Error(`Data presentasi tidak ditemukan: ${presentationId}`);
    }

    presentation.conversionStatus = 'PROCESSING';
    await presentation.save();

    try {
      // 1. Ambil buffer file asli dari GridFS
      const originalBuffer = await GridFSService.getFileBuffer(presentation.gridFsFileId);
      const fileExt = presentation.fileType.toLowerCase();

      let slidesData: ISlideData[] = [];
      let slideCount = 0;

      if (fileExt === 'pdf') {
        // Dokumen PDF asli adalah preview terbaik (100% presisi native tanpa konversi)
        presentation.previewGridFsFileId = presentation.gridFsFileId;

        // Hitung perkiraan jumlah halaman PDF secara non-destruktif
        const pdfText = originalBuffer.toString('binary');
        const pageMatches = pdfText.match(/\/Type\s*\/Page[^s]/g);
        slideCount = pageMatches ? pageMatches.length : 1;

        if (slideCount <= 0) {
          const countMatch = pdfText.match(/\/Pages[\s\S]*?\/Count\s+(\d+)/);
          if (countMatch && countMatch[1]) {
            slideCount = parseInt(countMatch[1], 10);
          }
        }
        if (slideCount <= 0) slideCount = 1;

        for (let i = 1; i <= Math.min(slideCount, 100); i++) {
          slidesData.push({
            slideNumber: i,
            title: `Halaman ${i} dari ${slideCount}`,
            bullets: [`Materi presentasi resmi calon ketua`],
          });
        }

        presentation.conversionStatus = 'COMPLETED';
      } else if (fileExt === 'pptx') {
        // Non-destructive outline extraction dari XML ppt/slides/
        try {
          const zip = await JSZip.loadAsync(originalBuffer);
          const slideFiles = Object.keys(zip.files).filter((f) =>
            /^ppt\/slides\/slide\d+\.xml$/i.test(f)
          );

          slideFiles.sort((a, b) => {
            const numA = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || '0', 10);
            const numB = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || '0', 10);
            return numA - numB;
          });

          slideCount = slideFiles.length;

          for (let i = 0; i < slideFiles.length; i++) {
            const slideXml = await zip.files[slideFiles[i]].async('text');
            const pMatches = slideXml.match(/<a:p[\s>][\s\S]*?<\/a:p>/g) || [];
            const paragraphs = pMatches
              .map((p) => {
                const tMatches = p.match(/<a:t>([^<]+)<\/a:t>/g) || [];
                return tMatches
                  .map((t) => t.replace(/<[^>]+>/g, ''))
                  .join('')
                  .trim();
              })
              .filter(Boolean);

            const slideTitle = paragraphs[0] || `Slide ${i + 1}`;
            const bullets = paragraphs.slice(1, 10);

            slidesData.push({
              slideNumber: i + 1,
              title: slideTitle,
              bullets: bullets.length > 0 ? bullets : ['Materi paparan slide kandidat'],
            });
          }
        } catch (zipErr) {
          console.warn('[PresentationService] PPTX XML outline warning:', zipErr);
        }

        // Coba konversi via LibreOffice headless jika tersedia di server
        const previewPdfId = await this.tryConvertWithLibreOffice(
          originalBuffer,
          presentation.originalFileName,
          presentation._id.toString()
        );

        if (previewPdfId) {
          presentation.previewGridFsFileId = previewPdfId;
          presentation.conversionStatus = 'COMPLETED';
        } else {
          // LibreOffice tidak terpasang di host: simpan status READY untuk download langsung
          presentation.conversionStatus = 'READY';
        }
      } else {
        // Format legacy .ppt
        slideCount = 1;
        const previewPdfId = await this.tryConvertWithLibreOffice(
          originalBuffer,
          presentation.originalFileName,
          presentation._id.toString()
        );
        if (previewPdfId) {
          presentation.previewGridFsFileId = previewPdfId;
          presentation.conversionStatus = 'COMPLETED';
        } else {
          presentation.conversionStatus = 'READY';
        }
      }

      presentation.slideCount = slideCount || 1;
      presentation.slidesData = slidesData;
      presentation.conversionError = undefined;
      await presentation.save();

      return presentation;
    } catch (error: any) {
      console.error('[PresentationService] Processing error:', error);
      presentation.conversionStatus = 'FAILED';
      presentation.conversionError = error.message || 'Gagal memproses file materi presentasi.';
      await presentation.save();
      throw error;
    }
  }

  /**
   * Menjalankan konversi headless LibreOffice jika tersedia di server.
   * File hasil konversi diunggah sebagai previewGridFsFileId TERPISAH dan TIDAK PERNAH menimpa file asli.
   */
  private static async tryConvertWithLibreOffice(
    inputBuffer: Buffer,
    originalFileName: string,
    presentationId: string
  ): Promise<any | null> {
    const sofficeBin = this.findLibreOfficePath();
    if (!sofficeBin) {
      console.log(
        '[PresentationService] LibreOffice headless tidak ditemukan di server. Preview PDF artefak dilewati, file asli tetap utuh di GridFS.'
      );
      return null;
    }

    const tmpDir = path.join(os.tmpdir(), `soffice-${presentationId}-${Date.now()}`);
    fs.mkdirSync(tmpDir, { recursive: true });

    const safeBase = originalFileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const inputFilePath = path.join(tmpDir, safeBase);
    fs.writeFileSync(inputFilePath, inputBuffer);

    try {
      console.log(`[PresentationService] Menjalankan konversi LibreOffice headless: ${inputFilePath}`);
      await execFileAsync(sofficeBin, [
        '--headless',
        '--convert-to',
        'pdf',
        '--outdir',
        tmpDir,
        inputFilePath,
      ]);

      const baseNameWithoutExt = path.parse(safeBase).name;
      const expectedPdfPath = path.join(tmpDir, `${baseNameWithoutExt}.pdf`);

      if (fs.existsSync(expectedPdfPath)) {
        const pdfBuffer = fs.readFileSync(expectedPdfPath);
        const previewResult = await GridFSService.uploadBuffer(
          `preview-${presentationId}.pdf`,
          pdfBuffer,
          'application/pdf',
          { isPreview: true, presentationId }
        );
        console.log(`[PresentationService] Preview PDF tersimpan di GridFS: ${previewResult.fileId}`);
        return previewResult.fileId;
      }
    } catch (err: any) {
      console.warn('[PresentationService] LibreOffice execution warning:', err.message);
    } finally {
      // Bersihkan file sementara
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch {
        // ignore cleanup error
      }
    }

    return null;
  }
}
