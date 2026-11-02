import { Router } from 'express';
import authRoutes from './auth.routes.js';
import candidateRoutes from './candidate.routes.js';
import electionRoutes from './election.routes.js';
import presentationRoutes from './presentation.routes.js';
import quickcountRoutes from './quickcount.routes.js';
import reportRoutes from './report.routes.js';
import userRoutes from './user.routes.js';
import settingsRoutes from './settings.routes.js';
import auditRoutes from './audit.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/candidates', candidateRoutes);
router.use('/elections', electionRoutes);
router.use('/presentations', presentationRoutes);
router.use('/quickcount', quickcountRoutes);
router.use('/reports', reportRoutes);
router.use('/users', userRoutes);
router.use('/settings', settingsRoutes);
router.use('/audit', auditRoutes);

export default router;
