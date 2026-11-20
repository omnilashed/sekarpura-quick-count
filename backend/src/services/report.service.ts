import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import mongoose from 'mongoose';
import { QuickCountService } from './quickcount.service.js';
import { ElectionStage } from '../models/ElectionStage.js';
import { VoteSource } from '../models/VoteSource.js';
import { VoteSubmission } from '../models/VoteSubmission.js';
import { Candidate } from '../models/Candidate.js';
import { Election } from '../models/Election.js';

export class ReportService {
  /**
   * Helper to gather all election data for multi-round reporting
   */
  private static async loadStageReportData(stageId: string) {
    const stage = await ElectionStage.findById(stageId);
    if (!stage) throw new Error('Tahap pemilihan tidak ditemukan.');

    const election = await Election.findById(stage.electionId);
    const sources = await VoteSource.find({ stageId: stage._id }).sort({ sourceCode: 1 });
    const allStageCandidates = await Candidate.find({ _id: { $in: stage.candidateIds } })
      .sort({ candidateNumber: 1 })
      .lean();

    const isStage2 = stage.stageType === 'STAGE_2';

    // Calculate Round 1 QuickCount
    const qcRound1 = await QuickCountService.calculateStageQuickCount(stageId, true, 1);

    // Calculate Round 2 QuickCount (if Stage 2)
    const qcRound2 = isStage2
      ? await QuickCountService.calculateStageQuickCount(stageId, true, 2)
      : null;

    // Fetch verified latest submissions for both rounds
    const subsRound1 = await VoteSubmission.find({
      stageId: stage._id,
      $or: [{ round: 1 }, { round: { $exists: false } }],
      isLatestRevision: true,
    }).lean();

    const subsRound2 = isStage2
      ? await VoteSubmission.find({
          stageId: stage._id,
          round: 2,
          isLatestRevision: true,
        }).lean()
      : [];

    // Determine Final Definitive Winner
    let definitiveWinnerName = 'Belum Ditetapkan';
    let definitiveWinnerCandidate: any = null;
    let definitiveWinnerVotes = 0;
    let definitiveWinnerPercentage = '0%';

    if (isStage2 && qcRound2) {
      if (qcRound2.schemaRules?.skema2?.definitiveWinnerName) {
        definitiveWinnerName = qcRound2.schemaRules.skema2.definitiveWinnerName;
      } else if (
        qcRound2.rankings &&
        qcRound2.rankings.length >= 2 &&
        qcRound2.rankings[0].votes > qcRound2.rankings[1].votes
      ) {
        definitiveWinnerName = qcRound2.rankings[0].fullName;
      } else if (qcRound1.schemaRules?.skema1?.hasWinner50Plus1) {
        definitiveWinnerName = qcRound1.schemaRules.skema1.winnerName || 'Pemenang Putaran 1';
      }

      definitiveWinnerCandidate = allStageCandidates.find(
        (c) => c.fullName.toLowerCase() === definitiveWinnerName.toLowerCase()
      );

      const r2WinnerRank = qcRound2.rankings.find((r) => r.fullName === definitiveWinnerName);
      if (r2WinnerRank) {
        definitiveWinnerVotes = r2WinnerRank.votes;
        definitiveWinnerPercentage = `${r2WinnerRank.percentage}%`;
      }
    } else if (qcRound1.rankings.length > 0) {
      definitiveWinnerName = qcRound1.rankings[0].fullName;
      definitiveWinnerCandidate = allStageCandidates.find(
        (c) => c._id.toString() === qcRound1.rankings[0].candidateId
      );
      definitiveWinnerVotes = qcRound1.rankings[0].votes;
      definitiveWinnerPercentage = `${qcRound1.rankings[0].percentage}%`;
    }

    return {
      stage,
      election,
      sources,
      allStageCandidates,
      isStage2,
      qcRound1,
      qcRound2,
      subsRound1,
      subsRound2,
      definitiveWinnerName,
      definitiveWinnerCandidate,
      definitiveWinnerVotes,
      definitiveWinnerPercentage,
    };
  }

  /**
   * Generate CSV report with Putaran 1 and Putaran 2 completed
   */
  static async generateQuickCountCsv(stageId: string, requestedRound?: number): Promise<string> {
    const data = await this.loadStageReportData(stageId);
    const {
      stage,
      election,
      sources,
      allStageCandidates,
      isStage2,
      qcRound1,
      qcRound2,
      subsRound1,
      subsRound2,
      definitiveWinnerName,
      definitiveWinnerCandidate,
      definitiveWinnerVotes,
      definitiveWinnerPercentage,
    } = data;

    const rows: string[] = [];

    // Header Metadata
    rows.push('"SEKARPURA ELECTION CENTER - LAPORAN REKAPITULASI RESMI LENGKAP"');
    rows.push(`"Pemilihan:","${election?.title || 'Pemilihan Ketua SEKARPURA Halim'}"`);
    rows.push(`"Cabang:","${election?.branch || 'Halim Perdanakusuma'}"`);
    rows.push(`"Tahap:","${stage.name}"`);
    rows.push(`"Target DPT Surat Suara:","${stage.targetVotes || 24} Suara"`);
    rows.push(`"Waktu Pembuatan Dokumen:","${new Date().toLocaleString('id-ID')}"`);
    rows.push('');

    // Penetapan Pemenang Definitif (Jika Tahap 2)
    if (isStage2) {
      rows.push('"=== PENETAPAN HASIL AKHIR CALON KETUA SEKARPURA TERPILIH ==="');
      rows.push(`"Ketua Definitif Terpilih:","${definitiveWinnerName}"`);
      rows.push(`"Nomor Urut:","No. ${definitiveWinnerCandidate?.candidateNumber || '-'}"`);
      rows.push(`"Jabatan / Unit Kerja:","${definitiveWinnerCandidate?.position || '-'} / ${definitiveWinnerCandidate?.workUnit || '-'}"`);
      rows.push(`"Perolehan Suara Putaran 2:","${definitiveWinnerVotes} Suara (${definitiveWinnerPercentage})"`);
      rows.push(`"Status Penetapan:","TERPILIH SECARA RESMI SEBAGAI KETUA SEKARPURA HALIM 2026-2029"`);
      rows.push('');

      rows.push('"=== RINGKASAN MEKANISME SKEMA PEMILIHAN ==="');
      rows.push(`"Skema 1 (Putaran 1 - Syarat 50% + 1)":,"Target ${qcRound1.targetVotes} Suara | Kuorum 50%+1: ${qcRound1.schemaRules?.skema1?.threshold50Plus1 || 13} Suara"`);
      rows.push(`"Status Skema 1":,"${qcRound1.schemaRules?.skema1?.hasWinner50Plus1 ? 'Terpenuhi di Putaran 1' : 'Tidak ada calon mencapai 50%+1, lanjut ke Putaran 2 dengan 2 calon peraih suara terbanyak'}"`);
      rows.push(`"Calon Lolos ke Putaran 2":,"${qcRound1.schemaRules?.skema1?.top2CandidateNames?.join(' dan ') || '2 Calon Teratas'}"`);
      rows.push(`"Skema 2 (Putaran 2 - Pemilihan Definitif)":,"Finalis: ${qcRound2?.rankings?.map((r) => `${r.fullName} (${r.votes} suara)`).join(' vs ') || '-'}"`);
      rows.push(`"Ketentuan Suara Penentu GM Halim":,"${stage.isTieBreakerActive && stage.tieBreakerCandidateId ? `Diterapkan untuk ${qcRound2?.schemaRules?.skema2?.gmTieBreakerCandidateName || 'Kandidat'} (+1 suara penentu GM)` : 'Tidak diperlukan (Kemenangan mutlak tanpa hasil seri 50%-50%)'}"`);
      rows.push('');
    }

    // Rekapitulasi Putaran 1
    rows.push('"=== REKAPITULASI PEROLEHAN SUARA - PUTARAN 1 (SKEMA 1 50%+1) ==="');
    rows.push(`"Total Suara Masuk P1:","${qcRound1.totalVotesIn}"`);
    rows.push(`"Suara Sah P1:","${qcRound1.validVotes}"`);
    rows.push(`"Suara Tidak Sah P1:","${qcRound1.invalidVotes}"`);
    rows.push(`"Target Surat Suara P1:","${qcRound1.targetVotes}"`);
    rows.push(`"Ambang Batas 50% + 1:","${qcRound1.schemaRules?.skema1?.threshold50Plus1 || 13} Suara"`);
    rows.push('');
    rows.push('"Peringkat","No. Urut","Nama Lengkap","Nama Panggilan","Jabatan","Unit Kerja","Suara Putaran 1","Persentase (%)","Status Kualifikasi Putaran 2"');

    const top2Ids =
      qcRound1.schemaRules?.skema1?.top2CandidateIds ||
      stage.round2CandidateIds?.map((id: any) => id.toString()) ||
      [];

    qcRound1.rankings.forEach((r) => {
      const isQualified = top2Ids.includes(r.candidateId);
      const kualifikasi = isStage2
        ? isQualified
          ? 'Lolos ke Putaran 2 (Top 2)'
          : 'Gugur di Putaran 1'
        : 'Penjaringan';
      rows.push(
        `"${r.rank}","${r.candidateNumber}","${r.fullName}","${r.nickname}","${r.position}","${r.workUnit}","${r.votes}","${r.percentage}%","${kualifikasi}"`
      );
    });
    rows.push('');

    // Rekapitulasi Putaran 2 (Jika Stage 2)
    if (isStage2 && qcRound2) {
      rows.push('"=== REKAPITULASI PEROLEHAN SUARA - PUTARAN 2 (SKEMA 2 DEFINITIF) ==="');
      rows.push(`"Total Suara Masuk P2:","${qcRound2.totalVotesIn}"`);
      rows.push(`"Suara Sah P2:","${qcRound2.validVotes}"`);
      rows.push(`"Suara Tidak Sah P2:","${qcRound2.invalidVotes}"`);
      rows.push(`"Target Surat Suara P2:","${qcRound2.targetVotes}"`);
      rows.push('');
      rows.push('"Peringkat","No. Urut","Nama Lengkap","Nama Panggilan","Jabatan","Unit Kerja","Suara TPS","Suara Penentu GM (+1)","Total Akhir","Persentase (%)","Status Penetapan"');

      qcRound2.rankings.forEach((r) => {
        const isWinner = r.fullName.toLowerCase() === definitiveWinnerName.toLowerCase();
        const gmVoteAdd =
          stage.isTieBreakerActive && stage.tieBreakerCandidateId?.toString() === r.candidateId
            ? 1
            : 0;
        const statusPenetapan = isWinner ? 'KETUA DEFINITIF TERPILIH' : 'RUNNER UP';
        rows.push(
          `"${r.rank}","${r.candidateNumber}","${r.fullName}","${r.nickname}","${r.position}","${r.workUnit}","${r.votes - gmVoteAdd}","${gmVoteAdd}","${r.votes}","${r.percentage}%","${statusPenetapan}"`
        );
      });
      rows.push('');
    }

    // Rincian Per TPS
    rows.push('"=== RINCIAN PEROLEHAN SUARA PER TPS (PUTARAN 1 & PUTARAN 2) ==="');
    const headerCols = ['Kode TPS', 'Nama TPS', 'Unit Kerja', 'Lokasi'];
    allStageCandidates.forEach((c) => {
      headerCols.push(`P1: No.${c.candidateNumber} ${c.nickname}`);
    });
    headerCols.push('P1: Tidak Sah', 'P1: Total Suara');

    if (isStage2 && qcRound2) {
      qcRound2.rankings.forEach((c) => {
        headerCols.push(`P2: No.${c.candidateNumber} ${c.nickname}`);
      });
      headerCols.push('P2: Tidak Sah', 'P2: Total Suara');
    }
    rows.push(headerCols.map((h) => `"${h}"`).join(','));

    sources.forEach((s) => {
      const sub1: any = subsRound1.find((sub) => sub.sourceId.toString() === s._id.toString());
      const sub2: any = isStage2
        ? subsRound2.find((sub) => sub.sourceId.toString() === s._id.toString())
        : null;

      const tpsRow = [s.sourceCode, s.sourceName, s.workUnit, s.location];

      // Putaran 1 votes
      allStageCandidates.forEach((c) => {
        const count =
          sub1?.votes?.find((v: any) => v.candidateId.toString() === c._id.toString())?.count || 0;
        tpsRow.push(count);
      });
      tpsRow.push(sub1?.invalidVotes || 0);
      tpsRow.push(sub1?.totalVotes || 0);

      // Putaran 2 votes
      if (isStage2 && qcRound2) {
        qcRound2.rankings.forEach((c) => {
          const count =
            sub2?.votes?.find((v: any) => v.candidateId.toString() === c.candidateId)?.count || 0;
          tpsRow.push(count);
        });
        tpsRow.push(sub2?.invalidVotes || 0);
        tpsRow.push(sub2?.totalVotes || 0);
      }

      rows.push(tpsRow.map((val) => `"${val}"`).join(','));
    });

    // BOM prefix to ensure Excel on Windows opens UTF-8 Indonesian accents cleanly
    return '\uFEFF' + rows.join('\r\n');
  }

  /**
   * Generate Excel report (.xlsx) with 4 comprehensive sheets for Round 1 & Round 2
   */
  static async generateQuickCountExcel(
    stageId: string,
    requestedRound?: number
  ): Promise<Buffer> {
    const data = await this.loadStageReportData(stageId);
    const {
      stage,
      election,
      sources,
      allStageCandidates,
      isStage2,
      qcRound1,
      qcRound2,
      subsRound1,
      subsRound2,
      definitiveWinnerName,
      definitiveWinnerCandidate,
      definitiveWinnerVotes,
      definitiveWinnerPercentage,
    } = data;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SEKARPURA Election Center';
    workbook.created = new Date();

    const isFinal =
      stage.status === 'COMPLETED' ||
      stage.status === 'LOCKED' ||
      (isStage2 && stage.round2Completed);
    const statusLabel = isFinal ? 'HASIL RESMI PENETAPAN FINAL' : 'REKAPITULASI SEMENTARA';

    // ----------------------------------------------------
    // SHEET 1: RINGKASAN & PENETAPAN HASIL
    // ----------------------------------------------------
    const sheet1 = workbook.addWorksheet('Ringkasan & Penetapan');

    // Header Banner
    sheet1.mergeCells('A1:I1');
    const titleCell = sheet1.getCell('A1');
    titleCell.value = 'SEKARPURA ELECTION CENTER - LAPORAN REKAPITULASI RESMI';
    titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B1630' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet1.getRow(1).height = 36;

    sheet1.mergeCells('A2:I2');
    const subTitleCell = sheet1.getCell('A2');
    subTitleCell.value =
      'Serikat Pekerja Angkasa Pura Indonesia - Cabang Bandara Internasional Halim Perdanakusuma';
    subTitleCell.font = { italic: true, size: 11, color: { argb: 'FFF5C451' } };
    subTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B1630' } };
    subTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet1.getRow(2).height = 24;

    sheet1.addRow([]);

    // Section A: Informasi Umum
    const addSectionHeader = (sheet: ExcelJS.Worksheet, title: string, fillHex: string) => {
      const row = sheet.addRow([title]);
      sheet.mergeCells(`A${row.number}:I${row.number}`);
      const c = sheet.getCell(`A${row.number}`);
      c.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillHex } };
      c.alignment = { horizontal: 'left', vertical: 'middle' };
      row.height = 24;
    };

    addSectionHeader(sheet1, 'A. INFORMASI TAHAPAN PEMILIHAN', 'FF142C52');
    sheet1.addRow(['Judul Pemilihan', election?.title || 'Pemilihan Ketua SEKARPURA Halim']);
    sheet1.addRow(['Cabang / Bandara', election?.branch || 'Halim Perdanakusuma']);
    sheet1.addRow(['Tahapan', stage.name]);
    sheet1.addRow(['Status Rekapitulasi', statusLabel]);
    sheet1.addRow(['Target DPT / Surat Suara', `${stage.targetVotes || 24} Suara Pemilih`]);
    sheet1.addRow(['Waktu Pencetakan Laporan', new Date().toLocaleString('id-ID')]);
    sheet1.addRow([]);

    // Section B: Penetapan Pemenang
    if (isStage2) {
      addSectionHeader(sheet1, 'B. HASIL PENETAPAN KETUA SEKARPURA HALIM TERPILIH', 'FF0284C7');
      sheet1.addRow(['Ketua Definitif Terpilih', definitiveWinnerName]);
      sheet1.addRow(['Nomor Urut', `No. ${definitiveWinnerCandidate?.candidateNumber || '-'}`]);
      sheet1.addRow([
        'Jabatan & Unit Kerja',
        `${definitiveWinnerCandidate?.position || '-'} (${definitiveWinnerCandidate?.workUnit || '-'})`,
      ]);
      sheet1.addRow([
        'Perolehan Suara Putaran 2',
        `${definitiveWinnerVotes} Suara (${definitiveWinnerPercentage})`,
      ]);
      sheet1.addRow([
        'Status Legalitas',
        'SAH TERPILIH SEBAGAI KETUA SEKARPURA CABANG HALIM MASA BAKTI 2026-2029',
      ]);
      sheet1.addRow([]);

      // Section C: Ringkasan Skema 1 & Skema 2
      addSectionHeader(sheet1, 'C. RINGKASAN MEKANISME & PENERAPAN SKEMA PEMILIHAN', 'FF142C52');
      sheet1.addRow([
        'Skema 1 (Putaran 1)',
        `Target: ${qcRound1.targetVotes} Suara | Kuorum 50%+1: ${qcRound1.schemaRules?.skema1?.threshold50Plus1 || 13} Suara`,
      ]);
      sheet1.addRow([
        'Hasil Skema 1',
        qcRound1.schemaRules?.skema1?.hasWinner50Plus1
          ? `Terpenuhi pada Putaran 1 oleh ${qcRound1.schemaRules?.skema1?.winnerName}`
          : 'Tidak ada calon mencapai 50%+1 -> Lanjut Putaran 2 dengan 2 calon peraih suara terbanyak',
      ]);
      sheet1.addRow([
        'Calon Lolos ke Putaran 2',
        qcRound1.schemaRules?.skema1?.top2CandidateNames?.join(' dan ') || 'Lukman Harun dan Ari Ramadani',
      ]);
      sheet1.addRow([
        'Skema 2 (Putaran 2)',
        `Finalis: ${qcRound2?.rankings?.map((r) => `${r.fullName} (${r.votes} suara)`).join(' vs ')}`,
      ]);
      sheet1.addRow([
        'Ketentuan Suara GM Halim',
        'Jika seri 50%-50% (12 vs 12), terdapat +1 suara penentu dari General Manager Bandara Halim PK.',
      ]);
      sheet1.addRow([
        'Penerapan Suara GM Halim',
        stage.isTieBreakerActive && stage.tieBreakerCandidateId
          ? `Diterapkan untuk ${qcRound2?.schemaRules?.skema2?.gmTieBreakerCandidateName || 'Kandidat'} (${stage.tieBreakerNotes || 'Keputusan GM'})`
          : 'Tidak diperlukan (Hasil perolehan suara mutlak tanpa hasil seri)',
      ]);
      sheet1.addRow([]);

      // Section D: Perbandingan Ringkas Putaran 1 vs Putaran 2
      addSectionHeader(sheet1, 'D. KOMPARASI PEROLEHAN SUARA PUTARAN 1 VS PUTARAN 2', 'FF142C52');
      const compHead = sheet1.addRow([
        'No. Urut',
        'Nama Lengkap Kandidat',
        'Unit Kerja',
        'Suara P1',
        'Persentase P1',
        'Status P1',
        'Suara P2',
        'Persentase P2',
        'Status Akhir',
      ]);
      compHead.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      compHead.eachCell((c) => {
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
        c.alignment = { horizontal: 'center' };
      });

      const top2IdsSet = new Set(
        qcRound1.schemaRules?.skema1?.top2CandidateIds ||
          stage.round2CandidateIds?.map((id: any) => id.toString()) ||
          []
      );

      allStageCandidates.forEach((c) => {
        const r1 = qcRound1.rankings.find((r) => r.candidateId === c._id.toString());
        const r2 = qcRound2?.rankings.find((r) => r.candidateId === c._id.toString());

        const isTop2 = top2IdsSet.has(c._id.toString());
        const statusP1 = isTop2 ? 'Lolos Putaran 2 (Top 2)' : 'Gugur Putaran 1';
        const isWinner = c.fullName.toLowerCase() === definitiveWinnerName.toLowerCase();
        const statusAkhir = isWinner
          ? 'KETUA TERPILIH'
          : r2
          ? 'RUNNER UP'
          : 'GUGUR DI PUTARAN 1';

        const row = sheet1.addRow([
          c.candidateNumber,
          c.fullName,
          c.workUnit,
          r1 ? r1.votes : 0,
          r1 ? `${r1.percentage}%` : '0%',
          statusP1,
          r2 ? r2.votes : '-',
          r2 ? `${r2.percentage}%` : '-',
          statusAkhir,
        ]);

        if (isWinner) {
          row.eachCell((cell) => {
            cell.font = { bold: true };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F4EA' } };
          });
        }
      });
    }

    sheet1.columns.forEach((col, idx) => {
      col.width = idx === 0 ? 25 : idx === 1 ? 32 : 20;
    });

    // ----------------------------------------------------
    // SHEET 2: REKAPITULASI PUTARAN 1 (LENGKAP)
    // ----------------------------------------------------
    const sheet2 = workbook.addWorksheet('Rekapitulasi Putaran 1');

    sheet2.mergeCells('A1:I1');
    const s2Title = sheet2.getCell('A1');
    s2Title.value = 'REKAPITULASI RESMI PEROLEHAN SUARA - PUTARAN 1 (SKEMA 1 50%+1)';
    s2Title.font = { bold: true, size: 13, color: { argb: 'FFFFFFFF' } };
    s2Title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B1630' } };
    s2Title.alignment = { horizontal: 'center' };
    sheet2.getRow(1).height = 30;

    sheet2.addRow([
      `Target DPT: ${qcRound1.targetVotes} Suara | Total Masuk: ${qcRound1.totalVotesIn} | Sah: ${qcRound1.validVotes} | Tidak Sah: ${qcRound1.invalidVotes} | Kuorum 50%+1: ${qcRound1.schemaRules?.skema1?.threshold50Plus1 || 13} Suara`,
    ]);
    sheet2.addRow([]);

    const s2Head = sheet2.addRow([
      'Peringkat',
      'No. Urut',
      'Nama Kandidat',
      'Nama Panggilan',
      'Jabatan',
      'Unit Kerja',
      'Jumlah Suara',
      'Persentase',
      'Status Kualifikasi Putaran 2',
    ]);
    s2Head.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    s2Head.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF142C52' } };
      cell.alignment = { horizontal: 'center' };
    });

    const top2IdsList =
      qcRound1.schemaRules?.skema1?.top2CandidateIds ||
      stage.round2CandidateIds?.map((id: any) => id.toString()) ||
      [];

    qcRound1.rankings.forEach((r) => {
      const isAdv = top2IdsList.includes(r.candidateId);
      const row = sheet2.addRow([
        r.rank,
        r.candidateNumber,
        r.fullName,
        r.nickname,
        r.position,
        r.workUnit,
        r.votes,
        `${r.percentage}%`,
        isStage2
          ? isAdv
            ? 'Lolos ke Putaran 2 (Top 2 Suara Terbanyak)'
            : 'Gugur di Putaran 1'
          : 'Penjaringan',
      ]);

      if (isAdv) {
        row.getCell(9).font = { bold: true, color: { argb: 'FF059669' } };
      }
    });

    sheet2.columns.forEach((c) => {
      c.width = 22;
    });

    // ----------------------------------------------------
    // SHEET 3: REKAPITULASI PUTARAN 2 (LENGKAP)
    // ----------------------------------------------------
    if (isStage2 && qcRound2) {
      const sheet3 = workbook.addWorksheet('Rekapitulasi Putaran 2');

      sheet3.mergeCells('A1:I1');
      const s3Title = sheet3.getCell('A1');
      s3Title.value = 'REKAPITULASI RESMI PEROLEHAN SUARA - PUTARAN 2 (SKEMA 2 CALON DEFINITIF)';
      s3Title.font = { bold: true, size: 13, color: { argb: 'FFFFFFFF' } };
      s3Title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B1630' } };
      s3Title.alignment = { horizontal: 'center' };
      sheet3.getRow(1).height = 30;

      sheet3.addRow([
        `Target DPT: ${qcRound2.targetVotes} Suara | Total Masuk: ${qcRound2.totalVotesIn} | Sah: ${qcRound2.validVotes} | Tidak Sah: ${qcRound2.invalidVotes}`,
      ]);
      sheet3.addRow([]);

      const s3Head = sheet3.addRow([
        'Peringkat',
        'No. Urut',
        'Nama Kandidat',
        'Jabatan',
        'Unit Kerja',
        'Suara Pemilih TPS',
        'Suara Tambahan GM (+1)',
        'Total Suara Akhir',
        'Persentase',
        'Status Penetapan',
      ]);
      s3Head.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      s3Head.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF142C52' } };
        cell.alignment = { horizontal: 'center' };
      });

      qcRound2.rankings.forEach((r) => {
        const isWinner = r.fullName.toLowerCase() === definitiveWinnerName.toLowerCase();
        const gmVoteAdd =
          stage.isTieBreakerActive && stage.tieBreakerCandidateId?.toString() === r.candidateId
            ? 1
            : 0;

        const row = sheet3.addRow([
          r.rank,
          r.candidateNumber,
          r.fullName,
          r.position,
          r.workUnit,
          r.votes - gmVoteAdd,
          gmVoteAdd > 0 ? '+1 (GM Halim)' : '-',
          r.votes,
          `${r.percentage}%`,
          isWinner ? 'KETUA DEFINITIF TERPILIH' : 'RUNNER UP',
        ]);

        if (isWinner) {
          row.eachCell((cell) => {
            cell.font = { bold: true };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F4EA' } };
          });
          row.getCell(10).font = { bold: true, color: { argb: 'FF059669' } };
        }
      });

      sheet3.addRow([]);
      sheet3.addRow([
        'Catatan Khusus Suara Penentu GM Halim PK:',
        stage.isTieBreakerActive && stage.tieBreakerCandidateId
          ? `Suara penentu diberikan kepada ${qcRound2.schemaRules?.skema2?.gmTieBreakerCandidateName || 'Kandidat'} karena perolehan suara TPS seimbang 50%-50%.`
          : 'Hasil pemilihan memiliki pemenang dengan perolehan suara mutlak, sehingga hak suara penentu GM Halim PK tidak diperlukan.',
      ]);

      sheet3.columns.forEach((c) => {
        c.width = 22;
      });
    }

    // ----------------------------------------------------
    // SHEET 4: MATRIKS PEROLEHAN SUARA PER TPS (P1 & P2)
    // ----------------------------------------------------
    const sheet4 = workbook.addWorksheet('Matriks TPS (P1 & P2)');

    sheet4.mergeCells('A1:L1');
    const s4Title = sheet4.getCell('A1');
    s4Title.value = 'RINCIAN MATRIKS PEROLEHAN SUARA TPS (PUTARAN 1 & PUTARAN 2)';
    s4Title.font = { bold: true, size: 13, color: { argb: 'FFFFFFFF' } };
    s4Title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B1630' } };
    s4Title.alignment = { horizontal: 'center' };
    sheet4.getRow(1).height = 30;

    sheet4.addRow([]);

    const tpsHeadCols = ['Kode TPS', 'Nama Sumber TPS', 'Unit Kerja', 'Lokasi'];
    allStageCandidates.forEach((c) => {
      tpsHeadCols.push(`P1: No.${c.candidateNumber} ${c.nickname}`);
    });
    tpsHeadCols.push('P1: Tidak Sah', 'P1: Total');

    if (isStage2 && qcRound2) {
      qcRound2.rankings.forEach((c) => {
        tpsHeadCols.push(`P2: No.${c.candidateNumber} ${c.nickname}`);
      });
      tpsHeadCols.push('P2: Tidak Sah', 'P2: Total');
    }
    tpsHeadCols.push('Status Verifikasi');

    const s4Head = sheet4.addRow(tpsHeadCols);
    s4Head.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    s4Head.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF142C52' } };
      cell.alignment = { horizontal: 'center' };
    });

    sources.forEach((s) => {
      const sub1: any = subsRound1.find((sub) => sub.sourceId.toString() === s._id.toString());
      const sub2: any = isStage2
        ? subsRound2.find((sub) => sub.sourceId.toString() === s._id.toString())
        : null;

      const rowVals: any[] = [s.sourceCode, s.sourceName, s.workUnit, s.location];

      // P1 votes
      allStageCandidates.forEach((c) => {
        const count =
          sub1?.votes?.find((v: any) => v.candidateId.toString() === c._id.toString())?.count || 0;
        rowVals.push(count);
      });
      rowVals.push(sub1?.invalidVotes || 0);
      rowVals.push(sub1?.totalVotes || 0);

      // P2 votes
      if (isStage2 && qcRound2) {
        qcRound2.rankings.forEach((c) => {
          const count =
            sub2?.votes?.find((v: any) => v.candidateId.toString() === c.candidateId)?.count || 0;
          rowVals.push(count);
        });
        rowVals.push(sub2?.invalidVotes || 0);
        rowVals.push(sub2?.totalVotes || 0);
      }

      rowVals.push(s.status === 'VERIFIED' ? 'TERVERIFIKASI' : 'BELUM MASUK');

      sheet4.addRow(rowVals);
    });

    sheet4.columns.forEach((c) => {
      c.width = 20;
    });

    const uint8Array = await workbook.xlsx.writeBuffer();
    return Buffer.from(uint8Array);
  }

  /**
   * Generate PDF report with official styling covering Putaran 1 and Putaran 2
   */
  static async generateQuickCountPdf(
    stageId: string,
    requestedRound?: number
  ): Promise<Buffer> {
    const data = await this.loadStageReportData(stageId);
    const {
      stage,
      election,
      sources,
      allStageCandidates,
      isStage2,
      qcRound1,
      qcRound2,
      subsRound1,
      subsRound2,
      definitiveWinnerName,
      definitiveWinnerCandidate,
      definitiveWinnerVotes,
      definitiveWinnerPercentage,
    } = data;

    const isFinal =
      stage.status === 'COMPLETED' ||
      stage.status === 'LOCKED' ||
      (isStage2 && stage.round2Completed);
    const statusLabel = isFinal ? 'HASIL RESMI PENETAPAN FINAL' : 'REKAPITULASI SEMENTARA';

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 35, size: 'A4', bufferPages: true });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        // Add footer page numbers
        const range = doc.bufferedPageRange();
        for (let i = range.start; i < range.start + range.count; i++) {
          doc.switchToPage(i);
          doc
            .fontSize(7.5)
            .fillColor('#94A3B8')
            .text(
              `Dokumen Resmi Rekapitulasi SEKARPURA Cabang Halim Perdanakusuma | Halaman ${i + 1} dari ${range.count}`,
              35,
              doc.page.height - 25,
              { align: 'center', width: doc.page.width - 70 }
            );
        }
        resolve(Buffer.concat(buffers));
      });
      doc.on('error', reject);

      // ------------------------------------------------
      // PAGE 1: HEADER & BERITA ACARA PENETAPAN
      // ------------------------------------------------
      // Header Banner
      doc.rect(35, 35, 525, 55).fill('#0B1630');
      doc.fillColor('#F5C451').fontSize(13).font('Helvetica-Bold');
      doc.text('SEKARPURA ELECTION CENTER', 50, 47);
      doc.fillColor('#FFFFFF').fontSize(9.5).font('Helvetica');
      doc.text(
        'Serikat Pekerja Angkasa Pura Indonesia - Cabang Bandara Internasional Halim Perdanakusuma',
        50,
        63
      );
      doc.fillColor('#94A3B8').fontSize(7.5);
      doc.text(
        `Status: ${statusLabel} | Tanggal Cetak: ${new Date().toLocaleString('id-ID')} | Target DPT: ${stage.targetVotes || 24} Suara`,
        50,
        76
      );

      let y = 102;

      // Judul Laporan
      doc.fillColor('#0B1630').fontSize(11).font('Helvetica-Bold');
      doc.text('BERITA ACARA & REKAPITULASI HASIL PEMILIHAN CALON KETUA SEKARPURA', 35, y);
      y += 15;
      doc.fontSize(8.5).font('Helvetica').fillColor('#64748B');
      doc.text(
        `Tahapan: ${stage.name} (${election?.branch || 'Bandara Halim Perdanakusuma'} Masa Bakti 2026-2029)`,
        35,
        y
      );

      y += 18;

      // Box Penetapan Pemenang Definitif (Jika Stage 2)
      if (isStage2) {
        doc.rect(35, y, 525, 62).fill('#ECFDF5').stroke('#10B981');
        doc.fillColor('#065F46').fontSize(8.5).font('Helvetica-Bold');
        doc.text('PENETAPAN RESMI KETUA SEKARPURA CABANG HALIM TERPILIH:', 45, y + 8);

        doc.fillColor('#064E3B').fontSize(12).font('Helvetica-Bold');
        doc.text(
          `${definitiveWinnerName} (No. Urut ${definitiveWinnerCandidate?.candidateNumber || '-'})`,
          45,
          y + 22
        );

        doc.fillColor('#047857').fontSize(8).font('Helvetica');
        doc.text(
          `Jabatan: ${definitiveWinnerCandidate?.position || '-'} | Unit Kerja: ${definitiveWinnerCandidate?.workUnit || '-'}`,
          45,
          y + 37
        );
        doc.text(
          `Total Perolehan Suara Putaran 2: ${definitiveWinnerVotes} Suara (${definitiveWinnerPercentage}) - SAH DITETAPKAN SEBAGAI KETUA TERPILIH`,
          45,
          y + 49
        );

        y += 70;
      }

      // Ringkasan Mekanisme Skema Pemilihan
      if (isStage2) {
        doc.rect(35, y, 525, 42).fill('#F8FAFC').stroke('#E2E8F0');
        doc.fillColor('#1E293B').fontSize(7.5).font('Helvetica-Bold');
        doc.text('RINGKASAN MEKANISME DUA SKEMA PEMILIHAN DEFINITIF:', 45, y + 6);
        doc.font('Helvetica').fillColor('#475569');
        doc.text(
          `• Skema 1 (Putaran 1): Target ${qcRound1.targetVotes} suara (50%+1 = ${qcRound1.schemaRules?.skema1?.threshold50Plus1 || 13} suara). Hasil: ${qcRound1.schemaRules?.skema1?.hasWinner50Plus1 ? 'Terpenuhi' : 'Tidak terpenuhi'} -> Meloloskan 2 calon teratas (${qcRound1.schemaRules?.skema1?.top2CandidateNames?.join(' & ') || 'Top 2'}).`,
          45,
          y + 18
        );
        doc.text(
          `• Skema 2 (Putaran 2): Finalis bertanding memperebutkan suara mayoritas. Jika seri 50%-50%, berlaku +1 suara penentu GM Halim PK (${stage.isTieBreakerActive && stage.tieBreakerCandidateId ? 'Diterapkan' : 'Tidak diperlukan'}).`,
          45,
          y + 29
        );

        y += 50;
      }

      // ------------------------------------------------
      // BAGIAN 1: HASIL REKAPITULASI PUTARAN 1
      // ------------------------------------------------
      doc.rect(35, y, 525, 18).fill('#142C52');
      doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
      doc.text('I. REKAPITULASI RESMI PUTARAN 1 (SKEMA 1: SYARAT 50% + 1)', 42, y + 5);

      y += 22;
      doc.fontSize(7.5).font('Helvetica').fillColor('#334155');
      doc.text(
        `Target Suara: ${qcRound1.targetVotes} | Suara Masuk: ${qcRound1.totalVotesIn} | Sah: ${qcRound1.validVotes} | Tidak Sah: ${qcRound1.invalidVotes} | Syarat 50%+1: ${qcRound1.schemaRules?.skema1?.threshold50Plus1 || 13} Suara`,
        35,
        y
      );

      y += 12;

      // Table Header Putaran 1
      doc.rect(35, y, 525, 16).fill('#E2E8F0');
      doc.fillColor('#0F172A').fontSize(7.5).font('Helvetica-Bold');
      doc.text('Rank', 40, y + 4);
      doc.text('No', 65, y + 4);
      doc.text('Nama Kandidat', 85, y + 4);
      doc.text('Unit Kerja', 225, y + 4);
      doc.text('Suara', 330, y + 4);
      doc.text('Persen', 375, y + 4);
      doc.text('Status Kualifikasi Putaran 2', 425, y + 4);

      y += 16;
      doc.font('Helvetica').fontSize(7.5);

      const top2IdsList =
        qcRound1.schemaRules?.skema1?.top2CandidateIds ||
        stage.round2CandidateIds?.map((id: any) => id.toString()) ||
        [];

      qcRound1.rankings.forEach((r, idx) => {
        const isAdv = top2IdsList.includes(r.candidateId);
        const rowBg = isAdv ? '#F0FDF4' : idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';

        doc.rect(35, y, 525, 16).fill(rowBg);
        doc.fillColor('#0F172A');
        doc.text(`#${r.rank}`, 40, y + 4);
        doc.text(`${r.candidateNumber}`, 65, y + 4);
        doc.font('Helvetica-Bold').text(r.fullName, 85, y + 4);
        doc.font('Helvetica').text(r.workUnit, 225, y + 4, { width: 100, height: 14 });
        doc.text(`${r.votes}`, 330, y + 4);
        doc.text(`${r.percentage}%`, 375, y + 4);

        if (isAdv) {
          doc.fillColor('#059669').font('Helvetica-Bold').text('Lolos Putaran 2 (Top 2)', 425, y + 4);
        } else {
          doc.fillColor('#64748B').font('Helvetica').text('Gugur di Putaran 1', 425, y + 4);
        }

        y += 16;
      });

      y += 10;

      // ------------------------------------------------
      // BAGIAN 2: HASIL REKAPITULASI PUTARAN 2 (JIKA STAGE 2)
      // ------------------------------------------------
      if (isStage2 && qcRound2) {
        if (y > 640) {
          doc.addPage();
          y = 45;
        }

        doc.rect(35, y, 525, 18).fill('#142C52');
        doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
        doc.text('II. REKAPITULASI RESMI PUTARAN 2 (SKEMA 2: CALON DEFINITIF)', 42, y + 5);

        y += 22;
        doc.fontSize(7.5).font('Helvetica').fillColor('#334155');
        doc.text(
          `Target Suara: ${qcRound2.targetVotes} | Suara Masuk: ${qcRound2.totalVotesIn} | Sah: ${qcRound2.validVotes} | Tidak Sah: ${qcRound2.invalidVotes}`,
          35,
          y
        );

        y += 12;

        // Table Header Putaran 2
        doc.rect(35, y, 525, 16).fill('#E2E8F0');
        doc.fillColor('#0F172A').fontSize(7.5).font('Helvetica-Bold');
        doc.text('Rank', 40, y + 4);
        doc.text('No', 65, y + 4);
        doc.text('Nama Kandidat', 85, y + 4);
        doc.text('Unit Kerja', 215, y + 4);
        doc.text('Suara TPS', 315, y + 4);
        doc.text('Suara GM', 370, y + 4);
        doc.text('Total', 425, y + 4);
        doc.text('Persen', 460, y + 4);
        doc.text('Status', 500, y + 4);

        y += 16;
        doc.font('Helvetica').fontSize(7.5);

        qcRound2.rankings.forEach((r, idx) => {
          const isWinner = r.fullName.toLowerCase() === definitiveWinnerName.toLowerCase();
          const rowBg = isWinner ? '#ECFDF5' : idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
          const gmVoteAdd =
            stage.isTieBreakerActive && stage.tieBreakerCandidateId?.toString() === r.candidateId
              ? 1
              : 0;

          doc.rect(35, y, 525, 18).fill(rowBg);
          doc.fillColor('#0F172A');
          doc.text(`#${r.rank}`, 40, y + 5);
          doc.text(`${r.candidateNumber}`, 65, y + 5);
          doc.font('Helvetica-Bold').text(r.fullName, 85, y + 5);
          doc.font('Helvetica').text(r.workUnit, 215, y + 5, { width: 95, height: 14 });
          doc.text(`${r.votes - gmVoteAdd}`, 315, y + 5);
          doc.text(gmVoteAdd > 0 ? '+1 (GM)' : '-', 370, y + 5);
          doc.font('Helvetica-Bold').text(`${r.votes}`, 425, y + 5);
          doc.font('Helvetica').text(`${r.percentage}%`, 460, y + 5);

          if (isWinner) {
            doc.fillColor('#059669').font('Helvetica-Bold').text('TERPILIH', 500, y + 5);
          } else {
            doc.fillColor('#64748B').font('Helvetica').text('Runner Up', 500, y + 5);
          }

          y += 18;
        });

        y += 10;
      }

      // ------------------------------------------------
      // BAGIAN 3: MATRIKS PEROLEHAN PER TPS
      // ------------------------------------------------
      if (y > 620) {
        doc.addPage();
        y = 45;
      }

      doc.rect(35, y, 525, 18).fill('#142C52');
      doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
      doc.text('III. RINCIAN PEROLEHAN SUARA PER TEMPAT PEMUNGUTAN SUARA (TPS)', 42, y + 5);

      y += 22;

      // Table Header TPS
      doc.rect(35, y, 525, 16).fill('#E2E8F0');
      doc.fillColor('#0F172A').fontSize(7.5).font('Helvetica-Bold');
      doc.text('Kode TPS', 40, y + 4);
      doc.text('Nama Sumber / Lokasi', 110, y + 4);
      doc.text('Rincian Putaran 1', 280, y + 4);
      if (isStage2 && qcRound2) {
        doc.text('Rincian Putaran 2', 430, y + 4);
      }
      doc.text('Status', 510, y + 4);

      y += 16;
      doc.font('Helvetica').fontSize(7.5);

      sources.forEach((s, idx) => {
        const sub1: any = subsRound1.find((sub) => sub.sourceId.toString() === s._id.toString());
        const sub2: any = isStage2
          ? subsRound2.find((sub) => sub.sourceId.toString() === s._id.toString())
          : null;

        const rowBg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
        doc.rect(35, y, 525, 20).fill(rowBg);
        doc.fillColor('#0F172A');
        doc.font('Helvetica-Bold').text(s.sourceCode, 40, y + 5);
        doc.font('Helvetica').text(`${s.sourceName} (${s.workUnit})`, 110, y + 5, {
          width: 165,
          height: 16,
        });

        // P1 summary text
        const p1Summary = sub1
          ? allStageCandidates
              .map((c) => {
                const cnt =
                  sub1.votes?.find((v: any) => v.candidateId.toString() === c._id.toString())
                    ?.count || 0;
                return `No.${c.candidateNumber}: ${cnt}`;
              })
              .join(', ') + ` (Total: ${sub1.totalVotes})`
          : 'Belum masuk';
        doc.text(p1Summary, 280, y + 5, { width: 145, height: 16 });

        // P2 summary text
        if (isStage2 && qcRound2) {
          const p2Summary = sub2
            ? qcRound2.rankings
                .map((c) => {
                  const cnt =
                    sub2.votes?.find((v: any) => v.candidateId.toString() === c.candidateId)
                      ?.count || 0;
                  return `No.${c.candidateNumber}: ${cnt}`;
                })
                .join(', ') + ` (Total: ${sub2.totalVotes})`
            : 'Belum masuk';
          doc.text(p2Summary, 430, y + 5, { width: 75, height: 16 });
        }

        doc.text(s.status === 'VERIFIED' ? 'VERIFIED' : 'BELUM', 510, y + 5);

        y += 20;
      });

      y += 15;

      // ------------------------------------------------
      // BAGIAN 4: PENGESAHAN & TANDA TANGAN
      // ------------------------------------------------
      if (y > 660) {
        doc.addPage();
        y = 45;
      }

      doc.rect(35, y, 525, 32).fill('#FEF3C7').stroke('#F59E0B');
      doc.fillColor('#92400E').fontSize(7.5).font('Helvetica-Bold');
      doc.text('CATATAN INTEGRITAS & KEABSAHAN DOKUMEN:', 45, y + 6);
      doc.font('Helvetica').fontSize(7);
      doc.text(
        'Laporan rekapitulasi ini dicetak dari sistem SEKARPURA Election Center secara resmi. Seluruh data perolehan suara diverifikasi melalui formulir plano TPS dan diaudit secara digital.',
        45,
        y + 17,
        { width: 505 }
      );

      y += 45;

      doc.fillColor('#0F172A').fontSize(8.5).font('Helvetica');
      doc.text(
        'Jakarta, ' +
          new Date().toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }),
        380,
        y
      );
      doc.text('Panitia Pemilihan SEKARPURA Halim', 380, y + 13);
      doc.font('Helvetica-Bold').text('Ketua Panitia Pemilihan Cabang', 380, y + 26);
      doc.font('Helvetica').text('(_______________________________)', 380, y + 70);

      doc.end();
    });
  }
}
