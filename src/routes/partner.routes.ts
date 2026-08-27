import { Router } from 'express';
import {
  getPartners,
  createPartner,
  updatePartner,
  deletePartner,
} from '../controllers/partnerController.js';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.js';

const router = Router();

router.get('/', getPartners);
router.post('/', authenticateToken, authorizeRoles('ADMIN', 'SUPER_ADMIN'), createPartner);
router.patch('/:id', authenticateToken, authorizeRoles('ADMIN', 'SUPER_ADMIN'), updatePartner);
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN', 'SUPER_ADMIN'), deletePartner);

export default router;
