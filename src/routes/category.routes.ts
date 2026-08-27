import { Router } from 'express';
import {
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.js';

const router = Router();

router.get('/', getCategories);
router.get('/:slug', getCategoryBySlug);
router.post('/', authenticateToken, authorizeRoles('ADMIN', 'SUPER_ADMIN'), createCategory);
router.patch('/:id', authenticateToken, authorizeRoles('ADMIN', 'SUPER_ADMIN'), updateCategory);
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN', 'SUPER_ADMIN'), deleteCategory);

export default router;
