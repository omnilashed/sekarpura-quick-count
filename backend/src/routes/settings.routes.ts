import { Router } from 'express';
import { SettingsController } from '../controllers/settings.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { requireRoles } from '../middlewares/rbac.js';

const router = Router();

router.get('/', SettingsController.getSettings);
router.put('/', authenticate, requireRoles('ADMIN', 'SUPER_ADMIN'), SettingsController.updateSettings);

export default router;
