import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { requireRoles } from '../middlewares/rbac.js';

const router = Router();

router.get('/', authenticate, requireRoles('ADMIN', 'SUPER_ADMIN'), UserController.getAllUsers);
router.post('/', authenticate, requireRoles('SUPER_ADMIN'), UserController.createAdminUser);
router.patch('/:id/toggle-status', authenticate, requireRoles('SUPER_ADMIN'), UserController.toggleStatus);
router.post('/:id/reset-password', authenticate, requireRoles('SUPER_ADMIN'), UserController.resetPassword);

export default router;
