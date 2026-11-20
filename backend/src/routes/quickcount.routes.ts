import { Router } from 'express';
import { QuickCountController } from '../controllers/quickcount.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { requireRoles } from '../middlewares/rbac.js';

const router = Router();

// Public: Live quickcount results
router.get('/', QuickCountController.getQuickCount);

// Public / Admin: Vote sources list
router.get('/sources', QuickCountController.getVoteSources);

// Admin: Register vote source
router.post(
  '/sources',
  authenticate,
  requireRoles('ADMIN', 'SUPER_ADMIN'),
  QuickCountController.createVoteSource
);

// Admin: Update vote source
router.put(
  '/sources/:id',
  authenticate,
  requireRoles('ADMIN', 'SUPER_ADMIN'),
  QuickCountController.updateVoteSource
);

// Admin: Delete vote source
router.delete(
  '/sources/:id',
  authenticate,
  requireRoles('ADMIN', 'SUPER_ADMIN'),
  QuickCountController.deleteVoteSource
);

// Admin: Submit initial votes
router.post(
  '/submit-votes',
  authenticate,
  requireRoles('ADMIN', 'SUPER_ADMIN'),
  QuickCountController.submitVotes
);

// Admin: Live tally (penghitungan langsung per surat suara tanpa syarat revisi)
router.post(
  '/live-tally',
  authenticate,
  requireRoles('ADMIN', 'SUPER_ADMIN'),
  QuickCountController.liveTally
);

// Admin: Correct votes (revisions with audit)
router.post(
  '/correct-votes',
  authenticate,
  requireRoles('ADMIN', 'SUPER_ADMIN'),
  QuickCountController.correctVotes
);

// Admin: Submission history / revision ledger
router.get(
  '/sources/:sourceId/history',
  authenticate,
  requireRoles('ADMIN', 'SUPER_ADMIN'),
  QuickCountController.getSubmissionHistory
);

// Admin: Reset vote data for a specific source / TPS (Official Production Reset)
router.post(
  '/sources/:sourceId/reset',
  authenticate,
  requireRoles('ADMIN', 'SUPER_ADMIN'),
  QuickCountController.resetVoteSource
);

// Admin: Reset all vote data for a stage (Official Production Reset)
router.post(
  '/stages/:stageId/reset-votes',
  authenticate,
  requireRoles('ADMIN', 'SUPER_ADMIN'),
  QuickCountController.resetStageVotes
);

export default router;
