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

// Admin: Submit initial votes
router.post(
  '/submit-votes',
  authenticate,
  requireRoles('ADMIN', 'SUPER_ADMIN'),
  QuickCountController.submitVotes
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

export default router;
