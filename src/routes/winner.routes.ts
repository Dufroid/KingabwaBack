import { Router } from 'express';
import { getWinners, createWinner } from '../controllers/winnerController.js';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.js';

const router = Router();

router.get('/', getWinners);
router.post('/', authenticateToken, authorizeRoles('ADMIN', 'SUPER_ADMIN'), createWinner);

export default router;
