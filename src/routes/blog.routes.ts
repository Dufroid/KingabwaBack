import { Router } from 'express';
import {
  getBlogPosts,
  getBlogPostBySlug,
  getBlogCategories,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
} from '../controllers/blogController.js';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.js';

const router = Router();

router.get('/posts', getBlogPosts);
router.get('/posts/:slug', getBlogPostBySlug);
router.get('/categories', getBlogCategories);

// Admin routes
router.post('/posts', authenticateToken, authorizeRoles('ADMIN', 'SUPER_ADMIN'), createBlogPost);
router.patch('/posts/:id', authenticateToken, authorizeRoles('ADMIN', 'SUPER_ADMIN'), updateBlogPost);
router.delete('/posts/:id', authenticateToken, authorizeRoles('ADMIN', 'SUPER_ADMIN'), deleteBlogPost);

export default router;
