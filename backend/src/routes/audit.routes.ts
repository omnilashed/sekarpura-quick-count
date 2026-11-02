import { Router } from 'express';
import { AuditController } from '../controllers/audit.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { requireRoles } from '../middlewares/rbac.js';

const router = Router();

router.get('/', authenticate, requireRoles('ADMIN', 'SUPER_ADMIN'), AuditController.getLogs);

export default router;
