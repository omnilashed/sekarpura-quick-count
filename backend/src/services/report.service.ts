import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { QuickCountService } from './quickcount.service.js';
import { ElectionStage } from '../models/ElectionStage.js';
import { VoteSource } from '../models/VoteSource.js';
import { VoteSubmission } from '../models/VoteSubmission.js';
import { Candidate } from '../models/Candidate.js';
import { Election } from '../models/Election.js';

export class ReportService {
  /**
   * Generate CSV report for stage quickcount
   */
  static async generateQuickCountCsv(stageId: string): Promise<string> {
    const data = await QuickCountService.calculateStageQuickCount(stageId);
    const election = await Election.findById(data.electionId);

    const isFinal = data.stageStatus === 'COMPLETED' || data.stageStatus === 'LOCKED';
    const statusLabel = isFinal ? 'HASIL FINAL RESMI' : 'HASIL SEMENTARA (QUICKCOUNT)';

    const rows: string[] = [];
    rows.push(`"LAPORAN PEROLEHAN SUARA - SEKARPURA ELECTION CENTER"`);
    rows.push(`"Pemilihan:","${election?.title || 'Pemilihan Ketua SEKARPURA'}"`);
    rows.push(`"Cabang:","${election?.branch || 'Halim Perdanakusuma'}"`);
    rows.push(`"Tahap:","${data.stageName}"`);
    rows.push(`"Status:","${statusLabel}"`);
    rows.push(`"Waktu Pembuatan:","${new Date().toLocaleString('id-ID')}"`);
    rows.push(`"Total Suara Masuk:","${data.totalVotesIn}"`);
    rows.push(`"Suara Sah:","${data.validVotes}"`);
    rows.push(`"Suara Tidak Sah:","${data.invalidVotes}"`);
    rows.push(`"Progres Sumber:","${data.completedSourcesCount}/${data.targetSourcesCount} (${data.progressPercentage}%)"`);
    rows.push('');
    rows.push('"Peringkat","No Urut","Nama Lengkap","Nama Panggilan","Jabatan","Unit Kerja","Jumlah Suara","Persentase (%)","Selisih dari #1"');

    data.rankings.forEach((r) => {
      rows.push(
        `"${r.rank}","${r.candidateNumber}","${r.fullName}","${r.nickname}","${r.position}","${r.workUnit}","${r.votes}","${r.percentage}%","${r.diffFromLeader}"`
      );
    });

    return rows.join('\n');
  }

  /**
   * Generate Excel report (.xlsx) for stage quickcount
   */
  static async generateQuickCountExcel(stageId: string): Promise<Buffer> {
    const data = await QuickCountService.calculateStageQuickCount(stageId);
    const election = await Election.findById(data.electionId);

    const isFinal = data.stageStatus === 'COMPLETED' || data.stageStatus === 'LOCKED';
    const statusLabel = isFinal ? 'HASIL FINAL RESMI' : 'HASIL SEMENTARA (QUICKCOUNT)';

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SEKARPURA Election Center';
    workbook.created = new Date();

    // Sheet 1: Rekapitulasi Suara
    const sheet1 = workbook.addWorksheet('Rekapitulasi Suara');

    // Title styling
    sheet1.mergeCells('A1:H1');
    const titleCell = sheet1.getCell('A1');
    titleCell.value = 'SEKARPURA ELECTION CENTER - LAPORAN REKAPITULASI SUARA';
    titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B1630' } };
    titleCell.alignment = { horizontal: 'center' };

    sheet1.addRow([
      `Pemilihan: ${election?.title || 'Pemilihan Ketua SEKARPURA Halim'} (${statusLabel})`,
    ]);
    sheet1.addRow([`Tahap: ${data.stageName} | Dicetak: ${new Date().toLocaleString('id-ID')}`]);
    sheet1.addRow([
      `Total Suara Masuk: ${data.totalVotesIn} | Suara Sah: ${data.validVotes} | Tidak Sah: ${data.invalidVotes} | Progres: ${data.progressPercentage}%`,
    ]);
    sheet1.addRow([]);

    const headerRow = sheet1.addRow([
      'Peringkat',
      'No. Urut',
      'Nama Kandidat',
      'Nama Panggilan',
      'Jabatan',
      'Unit Kerja',
      'Total Suara',
      'Persentase',
      'Selisih Peringkat 1',
    ]);

    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF142C52' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center' };
    });

    data.rankings.forEach((r) => {
      sheet1.addRow([
        r.rank,
        r.candidateNumber,
        r.fullName,
        r.nickname,
        r.position,
        r.workUnit,
        r.votes,
        `${r.percentage}%`,
        r.diffFromLeader,
      ]);
    });

    // Auto-fit column widths
    sheet1.columns.forEach((column) => {
      column.width = 18;
    });

    // Sheet 2: Data Sumber Suara
    const sheet2 = workbook.addWorksheet('Sumber Suara');
    sheet2.addRow(['Kode TPS/Sumber', 'Nama Sumber', 'Unit Kerja', 'Lokasi', 'Status']);
    const sources = await VoteSource.find({ stageId: data.stageId });
    sources.forEach((s) => {
      sheet2.addRow([s.sourceCode, s.sourceName, s.workUnit, s.location, s.status]);
    });
    sheet2.columns.forEach((col) => {
      col.width = 22;
    });

    const uint8Array = await workbook.xlsx.writeBuffer();
    return Buffer.from(uint8Array);
  }

  /**
   * Generate PDF report with official header and disclaimer
   */
  static async generateQuickCountPdf(stageId: string): Promise<Buffer> {
    const data = await QuickCountService.calculateStageQuickCount(stageId);
    const election = await Election.findById(data.electionId);

    const isFinal = data.stageStatus === 'COMPLETED' || data.stageStatus === 'LOCKED';
    const statusLabel = isFinal ? 'HASIL FINAL RESMI' : 'HASIL SEMENTARA (QUICKCOUNT)';

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Header Banner
      doc.rect(40, 40, 515, 60).fill('#0B1630');
      doc.fillColor('#F5C451').fontSize(14).font('Helvetica-Bold');
      doc.text('SEKARPURA ELECTION CENTER', 55, 52);
      doc.fillColor('#FFFFFF').fontSize(10).font('Helvetica');
      doc.text('Serikat Pekerja Angkasa Pura Indonesia - Cabang Halim Perdanakusuma', 55, 70);
      doc.fillColor('#94A3B8').fontSize(8);
      doc.text(`Status Laporan: ${statusLabel} | Tanggal Cetak: ${new Date().toLocaleString('id-ID')}`, 55, 84);

      // Meta Box
      let y = 115;
      doc.fillColor('#0B1630').fontSize(12).font('Helvetica-Bold');
      doc.text(`REKAPITULASI PEROLEHAN SUARA: ${data.stageName.toUpperCase()}`, 40, y);

      y += 20;
      doc.fontSize(9).font('Helvetica');
      doc.fillColor('#334155');
      doc.text(`Total Suara Masuk: ${data.totalVotesIn.toLocaleString('id-ID')} suara`, 40, y);
      doc.text(`Suara Sah: ${data.validVotes.toLocaleString('id-ID')} suara`, 220, y);
      doc.text(`Suara Tidak Sah: ${data.invalidVotes.toLocaleString('id-ID')} suara`, 380, y);

      y += 15;
      doc.text(`Sumber Suara Selesai: ${data.completedSourcesCount} dari ${data.targetSourcesCount} TPS (${data.progressPercentage}%)`, 40, y);

      // Table Header
      y += 25;
      doc.rect(40, y, 515, 20).fill('#142C52');
      doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
      doc.text('Rank', 45, y + 6);
      doc.text('No', 75, y + 6);
      doc.text('Nama Kandidat', 100, y + 6);
      doc.text('Unit Kerja', 270, y + 6);
      doc.text('Suara', 390, y + 6);
      doc.text('Persentase', 450, y + 6);
      doc.text('Selisih', 510, y + 6);

      // Table Rows
      y += 20;
      doc.font('Helvetica').fontSize(8);
      data.rankings.forEach((r, idx) => {
        const rowColor = idx % 2 === 0 ? '#F8FAFC' : '#FFFFFF';
        doc.rect(40, y, 515, 22).fill(rowColor);

        doc.fillColor('#0F172A');
        doc.text(`#${r.rank}`, 45, y + 7);
        doc.text(`${r.candidateNumber}`, 75, y + 7);
        doc.font('Helvetica-Bold').text(r.fullName, 100, y + 7);
        doc.font('Helvetica').text(r.workUnit, 270, y + 7, { width: 110, height: 18 });
        doc.text(`${r.votes.toLocaleString('id-ID')}`, 390, y + 7);
        doc.text(`${r.percentage}%`, 450, y + 7);
        doc.text(r.diffFromLeader === 0 ? '-' : `-${r.diffFromLeader}`, 510, y + 7);

        y += 22;
      });

      // Disclaimer Box
      y += 20;
      doc.rect(40, y, 515, 45).fill('#FEF3C7').stroke('#F59E0B');
      doc.fillColor('#92400E').fontSize(8).font('Helvetica-Bold');
      doc.text('PERHATIAN & CATATAN INTEGRITAS:', 50, y + 8);
      doc.font('Helvetica').fontSize(7.5);
      doc.text(
        isFinal
          ? 'Hasil di atas adalah penetapan akhir resmi oleh Panitia Pemilihan Ketua SEKARPURA Cabang Halim Perdanakusuma.'
          : 'Laporan ini merupakan hasil QuickCount sementara dan bukan penetapan resmi pemenang sampai seluruh sumber selesai diverifikasi dan disahkan.',
        50,
        y + 22,
        { width: 495 }
      );

      // Signatures
      y += 65;
      if (y > 700) {
        doc.addPage();
        y = 50;
      }
      doc.fillColor('#0F172A').fontSize(9).font('Helvetica');
      doc.text('Jakarta, ' + new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }), 380, y);
      doc.text('Panitia Pemilihan SEKARPURA Halim', 380, y + 15);
      doc.text('(_______________________________)', 380, y + 65);

      doc.end();
    });
  }
}
