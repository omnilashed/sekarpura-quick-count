import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { loginRateLimiter } from '../middlewares/rateLimiter.js';

const router = Router();

router.post('/login', loginRateLimiter, AuthController.login);
router.post('/logout', AuthController.logout);
router.get('/me', authenticate, AuthController.getMe);
router.post('/change-password', authenticate, loginRateLimiter, AuthController.changePassword);

export default router;
