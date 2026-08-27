import { Router } from 'express';
import { register, login, refreshToken, getMe } from '../controllers/authController.js';
import { authenticateToken } from '../middlewares/auth.js';
import { authRateLimiter } from '../middlewares/rateLimiter.js';

const router = Router();

router.post('/register', authRateLimiter, register);
router.post('/login', authRateLimiter, login);
router.post('/refresh', refreshToken);
router.get('/me', authenticateToken, getMe);

export default router;
