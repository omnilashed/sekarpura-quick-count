import { Router } from 'express';
import { PresentationController } from '../controllers/presentation.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { requireRoles } from '../middlewares/rbac.js';
import { uploadPresentation } from '../middlewares/upload.js';

const router = Router();

// Public read
router.get('/library', PresentationController.getAllPublished);
router.get('/candidate/:candidateId', PresentationController.getByCandidate);
router.get('/:id', PresentationController.getById);

// Upload (Candidate or Admin)
router.post(
  '/upload',
  authenticate,
  uploadPresentation.single('file'),
  PresentationController.upload
);

// Admin: status toggle
router.patch(
  '/:id/status',
  authenticate,
  requireRoles('ADMIN', 'SUPER_ADMIN'),
  PresentationController.updateStatus
);

// Delete
router.delete('/:id', authenticate, PresentationController.deletePresentation);

export default router;
