import { Router } from 'express';
import { getGallery, createGalleryMedia, deleteGalleryMedia } from '../controllers/galleryController.js';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.js';

const router = Router();

router.get('/', getGallery);
router.post('/', authenticateToken, authorizeRoles('ADMIN', 'SUPER_ADMIN'), createGalleryMedia);
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN', 'SUPER_ADMIN'), deleteGalleryMedia);

export default router;
