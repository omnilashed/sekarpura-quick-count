import { Router } from 'express';
import { ReportController } from '../controllers/report.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { requireRoles } from '../middlewares/rbac.js';

const router = Router();

// Admin: Export report (CSV, XLSX, PDF)
router.get(
  '/export',
  authenticate,
  requireRoles('ADMIN', 'SUPER_ADMIN'),
  ReportController.exportQuickCount
);

export default router;
