import { Router } from 'express';
import { castVote, getMyVotes, getVoteStatistics } from '../controllers/voteController.js';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.js';
import { voteRateLimiter } from '../middlewares/rateLimiter.js';

const router = Router();

router.post('/', authenticateToken, voteRateLimiter, castVote);
router.get('/my-votes', authenticateToken, getMyVotes);
router.get('/statistics', authenticateToken, authorizeRoles('ADMIN', 'SUPER_ADMIN'), getVoteStatistics);

export default router;
