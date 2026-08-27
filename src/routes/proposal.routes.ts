import { Router } from 'express';
import { submitProposal, getProposals, updateProposalStatus } from '../controllers/proposalController.js';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.js';

const router = Router();

router.post('/', submitProposal);
router.get('/', authenticateToken, authorizeRoles('ADMIN', 'SUPER_ADMIN'), getProposals);
router.patch('/:id', authenticateToken, authorizeRoles('ADMIN', 'SUPER_ADMIN'), updateProposalStatus);

export default router;
