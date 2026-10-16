"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminController_js_1 = require("../controllers/adminController.js");
const auth_js_1 = require("../middlewares/auth.js");
const router = (0, express_1.Router)();
router.get('/editions', adminController_js_1.getEditions);
// Protect all admin routes with authentication and ADMIN / SUPER_ADMIN roles
router.use(auth_js_1.authenticateToken, (0, auth_js_1.authorizeRoles)('ADMIN', 'SUPER_ADMIN'));
router.get('/dashboard', adminController_js_1.getDashboardMetrics);
router.get('/users', adminController_js_1.getUsers);
router.get('/transactions', adminController_js_1.getTransactions);
router.post('/editions/upload-image', adminController_js_1.uploadEditionImage, adminController_js_1.handleEditionImageUpload);
router.patch('/users/:id/role', adminController_js_1.updateUserRole);
router.post('/editions', adminController_js_1.createEdition);
router.patch('/editions/:id', adminController_js_1.updateEdition);
exports.default = router;
