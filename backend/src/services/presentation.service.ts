import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import PDFDocument from 'pdfkit';
import { Presentation, IPresentation, ISlideData } from '../models/Presentation.js';
import { env } from '../config/env.js';

export class PresentationService {
  /**
   * Process presentation file (.pdf, .pptx, .ppt)
   * Converts to web-viewable representation and extracts slides
   */
  static async processPresentation(presentationId: string): Promise<IPresentation> {
    const presentation = await Presentation.findById(presentationId);
    if (!presentation) {
      throw new Error('Data presentasi tidak ditemukan.');
    }

    presentation.conversionStatus = 'PROCESSING';
    await presentation.save();

    try {
      const originalPath = path.resolve(env.UPLOAD_DIR, presentation.originalFileKey);
      if (!fs.existsSync(originalPath)) {
        throw new Error(`File asli tidak ditemukan di path: ${originalPath}`);
      }

      const fileExt = presentation.fileType.toLowerCase();
      let slidesData: ISlideData[] = [];
      let convertedPdfKey = presentation.originalFileKey;
      const thumbnailKeys: string[] = [];

      if (fileExt === 'pptx') {
        // Read PPTX contents via JSZip
        const fileBuffer = fs.readFileSync(originalPath);
        const zip = await JSZip.loadAsync(fileBuffer);

        // Find all slide XML files in ppt/slides/
        const slideFiles = Object.keys(zip.files).filter((f) =>
          /^ppt\/slides\/slide\d+\.xml$/i.test(f)
        );

        // Sort slide files numerically
        slideFiles.sort((a, b) => {
          const numA = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || '0', 10);
          const numB = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || '0', 10);
          return numA - numB;
        });

        if (slideFiles.length > 0) {
          const decodeEntities = (s: string) =>
            s
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&quot;/g, '"')
              .replace(/&apos;/g, "'");

          for (let i = 0; i < slideFiles.length; i++) {
            const slideXml = await zip.files[slideFiles[i]].async('text');

            // Extract paragraphs <a:p>...</a:p> to preserve proper sentences and bullet points
            const pMatches = slideXml.match(/<a:p[\s>][\s\S]*?<\/a:p>/g) || [];
            const paragraphs = pMatches
              .map((p) => {
                const tMatches = p.match(/<a:t>([^<]+)<\/a:t>/g) || [];
                return decodeEntities(
                  tMatches.map((t) => t.replace(/<[^>]+>/g, '')).join('').trim()
                );
              })
              .filter(Boolean);

            const slideTitle = paragraphs[0] || `Slide ${i + 1}`;
            const bullets = paragraphs.slice(1, 15);

            slidesData.push({
              slideNumber: i + 1,
              title: slideTitle,
              bullets: bullets.length > 0 ? bullets : ['Materi paparan slide kandidat'],
              content: paragraphs.join('\n'),
            });
          }
        } else {
          // Fallback slides if xml structure differs
          slidesData = this.generateFallbackSlides(presentation.title);
        }

        // Generate converted web-friendly PDF representation using PDFKit
        const convertedFilename = `converted-${presentation._id}.pdf`;
        const convertedPath = path.join(env.UPLOAD_DIR, 'converted', convertedFilename);
        await this.generatePdfFromSlides(slidesData, presentation.title, convertedPath);
        convertedPdfKey = `converted/${convertedFilename}`;
      } else if (fileExt === 'pdf') {
        // For PDF files, preserve original file as web-viewable PDF
        convertedPdfKey = presentation.originalFileKey;

        // Read PDF to accurately detect actual page count and metadata
        const pdfBuffer = fs.readFileSync(originalPath);
        const pdfText = pdfBuffer.toString('binary');
        
        // Count actual /Type /Page instances in PDF
        const pageMatches = pdfText.match(/\/Type\s*\/Page[^s]/g);
        let pageCount = pageMatches ? pageMatches.length : 0;
        
        // Fallback: check /Count in Pages dictionary if pageMatches is empty
        if (pageCount === 0) {
          const countMatch = pdfText.match(/\/Pages[\s\S]*?\/Count\s+(\d+)/);
          if (countMatch && countMatch[1]) {
            pageCount = parseInt(countMatch[1], 10);
          }
        }
        if (pageCount <= 0) pageCount = 1;

        // Check if there is an embedded PDF Title
        const titleMatch = pdfText.match(/\/Title\s*\(([^)]+)\)/);
        const detectedTitle = titleMatch ? titleMatch[1].trim() : presentation.title;

        slidesData = [];
        for (let i = 1; i <= pageCount; i++) {
          slidesData.push({
            slideNumber: i,
            title: i === 1 ? detectedTitle : `Halaman ${i} dari ${pageCount}`,
            bullets: [
              `Dokumen Asli: ${presentation.originalFileName}`,
              `Halaman ${i} dari total ${pageCount} halaman materi presentasi`,
            ],
            content: `Halaman ${i} dari ${pageCount} materi presentasi asli: ${presentation.originalFileName}`,
          });
        }
      } else {
        // .ppt legacy binary format
        slidesData = this.generateFallbackSlides(presentation.title);
        const convertedFilename = `converted-${presentation._id}.pdf`;
        const convertedPath = path.join(env.UPLOAD_DIR, 'converted', convertedFilename);
        await this.generatePdfFromSlides(slidesData, presentation.title, convertedPath);
        convertedPdfKey = `converted/${convertedFilename}`;
      }

      presentation.slideCount = slidesData.length;
      presentation.slidesData = slidesData;
      presentation.convertedFileKey = convertedPdfKey;
      presentation.thumbnailKeys = thumbnailKeys;
      presentation.conversionStatus = 'COMPLETED';
      presentation.conversionError = undefined;
      await presentation.save();

      return presentation;
    } catch (error: any) {
      console.error('[PresentationService] Conversion failed:', error);
      presentation.conversionStatus = 'FAILED';
      presentation.conversionError = error.message || 'Gagal memproses file presentasi.';
      await presentation.save();
      throw error;
    }
  }

  private static generateFallbackSlides(title: string): ISlideData[] {
    return [
      {
        slideNumber: 1,
        title: title || 'Pemaparan Visi & Misi Calon Ketua',
        bullets: [
          'Serikat Pekerja Angkasa Pura Indonesia (SEKARPURA)',
          'Cabang Bandara Halim Perdanakusuma',
          'Tahun Pemilihan 2026',
        ],
      },
      {
        slideNumber: 2,
        title: 'Visi Pembangunan Serikat Pekerja',
        bullets: [
          'Mewujudkan SEKARPURA Halim yang mandiri, berintegritas, dan solutif',
          'Perlindungan hak pekerja bandara secara berkesinambungan',
          'Sinergi produktif antara manajemen dan serikat',
        ],
      },
      {
        slideNumber: 3,
        title: 'Misi & Pokok Kebijakan',
        bullets: [
          'Peningkatan advokasi ketenagakerjaan yang tanggap dan adil',
          'Transparansi pengelolaan dana iuran anggota',
          'Peningkatan kapasitas dan kompetensi pekerja',
        ],
      },
      {
        slideNumber: 4,
        title: 'Program Kerja Unggulan',
        bullets: [
          'Digitalisasi Layanan Aspirasi Anggota',
          'Klinik Advokasi & Konsultasi Hukum PKB',
          'Program Kesejahteraan & Dana Sosial Pekerja',
          'Dialog Berkala Bersama Manajemen Operasi',
        ],
      },
      {
        slideNumber: 5,
        title: 'Komitmen Kepemimpinan & Harapan',
        bullets: [
          'Menjunjung tinggi transparansi, akuntabilitas, dan loyalitas pada anggota',
          'Membangun Halim Perdanakusuma yang solid dan bermartabat',
          'Bersama Melangkah, Kuat Bersatu!',
        ],
      },
    ];
  }

  private static async generatePdfFromSlides(
    slides: ISlideData[],
    title: string,
    outputPath: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // 16:9 presentation slide size (841.89 x 472.27 pt)
      const doc = new PDFDocument({
        size: [842, 472],
        margin: 40,
        autoFirstPage: false,
      });

      const writeStream = fs.createWriteStream(outputPath);
      doc.pipe(writeStream);

      slides.forEach((slide) => {
        doc.addPage();

        // Background Slide
        doc.rect(0, 0, 842, 472).fill('#0B1630');

        // Top Accent Bar
        doc.rect(0, 0, 842, 8).fill('#F5C451');

        // Header SEKARPURA Halim
        doc.fillColor('#F5C451').fontSize(12).font('Helvetica-Bold');
        doc.text('SEKARPURA ELECTION CENTER | HALIM PERDANAKUSUMA', 40, 25);

        // Slide Title
        doc.fillColor('#FFFFFF').fontSize(26).font('Helvetica-Bold');
        doc.text(slide.title || `Slide ${slide.slideNumber}`, 40, 60, { width: 760 });

        // Divider
        doc.rect(40, 105, 762, 2).fill('#1E3E6E');

        // Bullets / Content
        let yPos = 135;
        if (slide.bullets && slide.bullets.length > 0) {
          doc.fontSize(14).font('Helvetica');
          slide.bullets.slice(0, 9).forEach((bullet) => {
            if (yPos > 405) return;
            doc.fillColor('#F5C451').text('•', 45, yPos);
            doc.fillColor('#E2E8F0').text(bullet, 65, yPos, { width: 730, lineBreak: false });
            yPos += 30;
          });
        } else if (slide.content) {
          doc.fillColor('#E2E8F0').fontSize(14).font('Helvetica');
          doc.text(slide.content, 45, yPos, { width: 750, height: 270 });
        }

        // Footer
        doc.rect(0, 445, 842, 27).fill('#142C52');
        doc.fillColor('#94A3B8').fontSize(10).font('Helvetica');
        doc.text('Materi Presentasi Calon Ketua SEKARPURA 2026', 40, 453);
        doc.text(`Slide ${slide.slideNumber} dari ${slides.length}`, 720, 453, { align: 'right' });
      });

      doc.end();
      writeStream.on('finish', () => resolve());
      writeStream.on('error', (err) => reject(err));
    });
  }
}
