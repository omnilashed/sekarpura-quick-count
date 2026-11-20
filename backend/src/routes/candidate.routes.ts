import { Router } from 'express';
import { CandidateController } from '../controllers/candidate.controller.js';
import { authenticate, optionalAuth } from '../middlewares/auth.js';
import { requireRoles, requireCandidateSelfOrAdmin } from '../middlewares/rbac.js';
import { uploadPhoto } from '../middlewares/upload.js';
import { uploadRateLimiter } from '../middlewares/rateLimiter.js';

const router = Router();

// Public / Authenticated read
router.get('/', optionalAuth, CandidateController.getAllCandidates);
router.get('/:id/photo', CandidateController.getPhoto);
router.get('/:id', optionalAuth, CandidateController.getCandidateById);

// Admin only: create candidate & linked user
router.post('/', authenticate, requireRoles('ADMIN', 'SUPER_ADMIN'), CandidateController.createCandidate);

// Update profile (Owner candidate or Admin)
router.put('/:id', authenticate, requireCandidateSelfOrAdmin, CandidateController.updateCandidateProfile);

// Upload photo (Owner candidate or Admin)
router.post(
  '/:id/photo',
  authenticate,
  requireCandidateSelfOrAdmin,
  uploadRateLimiter,
  uploadPhoto.single('photo'),
  CandidateController.uploadPhoto
);

// Admin only: Verify & approve
router.patch(
  '/:id/verify',
  authenticate,
  requireRoles('ADMIN', 'SUPER_ADMIN'),
  CandidateController.verifyCandidate
);

// Admin only: Delete candidate
router.delete(
  '/:id',
  authenticate,
  requireRoles('ADMIN', 'SUPER_ADMIN'),
  CandidateController.deleteCandidate
);

export default router;
