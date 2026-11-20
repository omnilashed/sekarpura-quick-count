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

// Admin/GM: Cast GM Bandara Halim PK Tie-Breaker Vote in Stage 2
router.post(
  '/stages/:stageId/gm-tie-breaker',
  authenticate,
  requireRoles('ADMIN', 'SUPER_ADMIN'),
  ElectionController.castGmTieBreaker
);

// Admin/GM: Reset GM Bandara Halim PK Tie-Breaker Vote in Stage 2
router.delete(
  '/stages/:stageId/gm-tie-breaker',
  authenticate,
  requireRoles('ADMIN', 'SUPER_ADMIN'),
  ElectionController.resetGmTieBreaker
);

// Admin: Advance from Putaran 1 to Putaran 2 (Skema 2: Head to Head 2 Calon Teratas)
router.post(
  '/stages/:stageId/advance-round-2',
  authenticate,
  requireRoles('ADMIN', 'SUPER_ADMIN'),
  ElectionController.advanceRound2
);

// Admin: Switch active round viewing
router.post(
  '/stages/:stageId/switch-round',
  authenticate,
  requireRoles('ADMIN', 'SUPER_ADMIN'),
  ElectionController.switchRound
);

// Admin: Reset Putaran 2 back to Putaran 1
router.post(
  '/stages/:stageId/reset-round-2',
  authenticate,
  requireRoles('ADMIN', 'SUPER_ADMIN'),
  ElectionController.resetRound2
);

// Admin: Finalize and lock Putaran 2 to database
router.post(
  '/stages/:stageId/finalize-round-2',
  authenticate,
  requireRoles('ADMIN', 'SUPER_ADMIN'),
  ElectionController.finalizeRound2
);

export default router;
