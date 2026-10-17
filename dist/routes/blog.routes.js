"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const blogController_js_1 = require("../controllers/blogController.js");
const auth_js_1 = require("../middlewares/auth.js");
const router = (0, express_1.Router)();
router.get('/posts', blogController_js_1.getBlogPosts);
router.get('/posts/:slug', blogController_js_1.getBlogPostBySlug);
router.get('/categories', blogController_js_1.getBlogCategories);
// Admin routes
router.post('/categories', auth_js_1.authenticateToken, (0, auth_js_1.authorizeRoles)('ADMIN', 'SUPER_ADMIN'), blogController_js_1.createBlogCategory);
router.post('/posts', auth_js_1.authenticateToken, (0, auth_js_1.authorizeRoles)('ADMIN', 'SUPER_ADMIN'), blogController_js_1.createBlogPost);
router.patch('/posts/:id', auth_js_1.authenticateToken, (0, auth_js_1.authorizeRoles)('ADMIN', 'SUPER_ADMIN'), blogController_js_1.updateBlogPost);
router.delete('/posts/:id', auth_js_1.authenticateToken, (0, auth_js_1.authorizeRoles)('ADMIN', 'SUPER_ADMIN'), blogController_js_1.deleteBlogPost);
// Upload media for blog (images/videos/pdf)
router.post('/upload-media', auth_js_1.authenticateToken, (0, auth_js_1.authorizeRoles)('ADMIN', 'SUPER_ADMIN'), blogController_js_1.uploadBlogMedia, blogController_js_1.handleBlogMediaUpload);
exports.default = router;
