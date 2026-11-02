import { Request, Response } from 'express';
import { ReportService } from '../services/report.service.js';
import { ElectionStage } from '../models/ElectionStage.js';
import { Election } from '../models/Election.js';

export class ReportController {
  /**
   * Export quickcount report (CSV, XLSX, PDF)
   */
  static async exportQuickCount(req: Request, res: Response): Promise<void> {
    const { stageId, format } = req.query;

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

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

    if (format === 'csv') {
      const csvData = await ReportService.generateQuickCountCsv(targetStageId);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="rekap-quickcount-sekarpura-${timestamp}.csv"`
      );
      res.status(200).send(csvData);
      return;
    }

    if (format === 'xlsx' || format === 'excel') {
      const excelBuffer = await ReportService.generateQuickCountExcel(targetStageId);
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="rekap-quickcount-sekarpura-${timestamp}.xlsx"`
      );
      res.status(200).send(excelBuffer);
      return;
    }

    // Default to PDF
    const pdfBuffer = await ReportService.generateQuickCountPdf(targetStageId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="laporan-quickcount-sekarpura-${timestamp}.pdf"`
    );
    res.status(200).send(pdfBuffer);
  }
}
