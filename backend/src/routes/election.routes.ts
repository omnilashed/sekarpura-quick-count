import { Router } from 'express';
import { ElectionController } from '../controllers/election.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { requireRoles } from '../middlewares/rbac.js';

const router = Router();

// Public: Get election and stages overview
router.get('/', ElectionController.getElection);
router.get('/stages', ElectionController.getStages);

// Admin: Update overall election status
router.patch(
  '/status',
  authenticate,
  requireRoles('ADMIN', 'SUPER_ADMIN'),
  ElectionController.updateElectionStatus
);

// Admin: Update stage status (COUNTING, COMPLETED, LOCKED)
router.patch(
  '/stages/:stageId/status',
  authenticate,
  requireRoles('ADMIN', 'SUPER_ADMIN'),
  ElectionController.updateStageStatus
);

// Admin: Promote Bakal Calon to Stage 2 Definitif
router.post(
  '/promote-to-stage2',
  authenticate,
  requireRoles('ADMIN', 'SUPER_ADMIN'),
  ElectionController.promoteCandidatesToStage2
);

export default router;
