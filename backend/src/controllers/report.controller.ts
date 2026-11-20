import { Request, Response } from 'express';
import { ReportService } from '../services/report.service.js';
import { ElectionStage } from '../models/ElectionStage.js';
import { Election } from '../models/Election.js';
import { getWibFilenameTimestamp } from '../utils/date.util.js';

export class ReportController {
  /**
   * Export quickcount report (CSV, XLSX, PDF)
   */
  static async exportQuickCount(req: Request, res: Response): Promise<void> {
    try {
      const { stageId, format, round } = req.query;

      let targetStageId = stageId as string;
      if (!targetStageId) {
        const election = await Election.findOne();
        if (election?.activeStageId) {
          targetStageId = election.activeStageId.toString();
        } else {
          const stage = await ElectionStage.findOne();
          if (stage) targetStageId = stage._id.toString();
        }
      }

      if (!targetStageId) {
        res.status(404).json({ success: false, message: 'Tahap pemilihan tidak ditemukan.' });
        return;
      }

      const stage = await ElectionStage.findById(targetStageId);
      const isStage2 = stage?.stageType === 'STAGE_2';
      const requestedRound = round ? Number(round) : undefined;
      const stagePrefix = isStage2 ? 'rekap-resmi-putaran1-dan-2' : 'rekap-resmi-penjaringan';
      const timestamp = getWibFilenameTimestamp();

      if (format === 'csv') {
        const csvData = await ReportService.generateQuickCountCsv(targetStageId, requestedRound);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${stagePrefix}-sekarpura-${timestamp}.csv"`
        );
        res.status(200).send(csvData);
        return;
      }

      if (format === 'xlsx' || format === 'excel') {
        const excelBuffer = await ReportService.generateQuickCountExcel(targetStageId, requestedRound);
        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${stagePrefix}-sekarpura-${timestamp}.xlsx"`
        );
        res.status(200).send(excelBuffer);
        return;
      }

      // Default to PDF
      const pdfBuffer = await ReportService.generateQuickCountPdf(targetStageId, requestedRound);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${stagePrefix}-sekarpura-${timestamp}.pdf"`
      );
      res.status(200).send(pdfBuffer);
    } catch (err: any) {
      console.error('Export report error:', err);
      res.status(500).json({
        success: false,
        message: 'Gagal mengekspor laporan rekapitulasi: ' + (err.message || 'Kesalahan server'),
      });
    }
  }
}
