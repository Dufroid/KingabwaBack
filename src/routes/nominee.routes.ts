import { Router } from 'express';
import {
  getNominees,
  getNomineeBySlug,
  createNominee,
  updateNominee,
  deleteNominee,
  handleNomineeImageUpload,
  uploadNomineeImage,
} from '../controllers/nomineeController.js';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.js';

const router = Router();

router.get('/', getNominees);
router.post('/upload-image', authenticateToken, authorizeRoles('ADMIN', 'SUPER_ADMIN'), uploadNomineeImage, handleNomineeImageUpload);
router.get('/:slug', getNomineeBySlug);
router.post('/', authenticateToken, authorizeRoles('ADMIN', 'SUPER_ADMIN'), createNominee);
router.patch('/:id', authenticateToken, authorizeRoles('ADMIN', 'SUPER_ADMIN'), updateNominee);
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN', 'SUPER_ADMIN'), deleteNominee);

export default router;
