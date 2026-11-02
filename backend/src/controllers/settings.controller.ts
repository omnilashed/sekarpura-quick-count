import { Request, Response } from 'express';
import { SystemSettings } from '../models/SystemSettings.js';
import { AuthRequest } from '../middlewares/auth.js';
import { AuditService } from '../services/audit.service.js';
import { updateSettingsSchema } from '../validations/schemas.js';

export class SettingsController {
  /**
   * Get system settings (Public & Admin)
   */
  static async getSettings(_req: Request, res: Response): Promise<void> {
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = await SystemSettings.create({
        appName: 'SEKARPURA ELECTION CENTER',
        appTagline: 'Transparansi Demokrasi, Membangun Solidaritas Pekerja.',
        organizationName: 'Serikat Pekerja Angkasa Pura Indonesia (SEKARPURA)',
        branchName: 'Cabang Halim Perdanakusuma',
        logoUrl: '/logo.svg',
        liveIndicator: true,
        allowCandidateEdit: true,
        publicQuickCountVisible: true,
        autoRefreshIntervalMs: 5000,
        maintenanceMode: false,
      });
    }

    res.status(200).json({
      success: true,
      data: settings,
    });
  }

  /**
   * Admin: Update system settings & branding
   */
  static async updateSettings(req: AuthRequest, res: Response): Promise<void> {
    const validated = updateSettingsSchema.parse(req.body);

    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = new SystemSettings(validated);
    } else {
      Object.assign(settings, validated);
    }

    settings.updatedBy = req.user?.id as any;
    await settings.save();

    await AuditService.record({
      actorId: req.user?.id,
      actorName: req.user?.name || 'Admin',
      actorRole: req.user?.role || 'ADMIN',
      action: 'SYSTEM_SETTINGS_UPDATED',
      entityType: 'SystemSettings',
      entityId: settings._id.toString(),
      after: validated,
      reason: 'Pembaruan konfigurasi dan identitas sistem',
    });

    res.status(200).json({
      success: true,
      message: 'Pengaturan sistem berhasil disimpan.',
      data: settings,
    });
  }
}
