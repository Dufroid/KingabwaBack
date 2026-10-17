import { Router } from 'express';
import {
  getBlogPosts,
  getBlogPostBySlug,
  getBlogCategories,
  createBlogCategory,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  uploadBlogMedia,
  handleBlogMediaUpload,
} from '../controllers/blogController.js';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.js';

const router = Router();

router.get('/posts', getBlogPosts);
router.get('/posts/:slug', getBlogPostBySlug);
router.get('/categories', getBlogCategories);

// Admin routes
router.post('/categories', authenticateToken, authorizeRoles('ADMIN', 'SUPER_ADMIN'), createBlogCategory);
router.post('/posts', authenticateToken, authorizeRoles('ADMIN', 'SUPER_ADMIN'), createBlogPost);
router.patch('/posts/:id', authenticateToken, authorizeRoles('ADMIN', 'SUPER_ADMIN'), updateBlogPost);
router.delete('/posts/:id', authenticateToken, authorizeRoles('ADMIN', 'SUPER_ADMIN'), deleteBlogPost);

// Upload media for blog (images/videos/pdf)
router.post('/upload-media', authenticateToken, authorizeRoles('ADMIN', 'SUPER_ADMIN'), uploadBlogMedia, handleBlogMediaUpload);

export default router;
