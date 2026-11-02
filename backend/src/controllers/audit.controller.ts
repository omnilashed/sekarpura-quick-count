import { Request, Response } from 'express';
import { AuditService } from '../services/audit.service.js';

export class AuditController {
  /**
   * Admin: List audit logs
   */
  static async getLogs(req: Request, res: Response): Promise<void> {
    const { stageId, entityType, limit, skip } = req.query;

    const result = await AuditService.getLogs({
      stageId: stageId as string,
      entityType: entityType as string,
      limit: limit ? parseInt(limit as string, 10) : 50,
      skip: skip ? parseInt(skip as string, 10) : 0,
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  }
}
