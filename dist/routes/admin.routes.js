"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminController_js_1 = require("../controllers/adminController.js");
const reportController_js_1 = require("../controllers/reportController.js");
const auth_js_1 = require("../middlewares/auth.js");
const router = (0, express_1.Router)();
router.get('/editions', adminController_js_1.getEditions);
// Protège toutes les routes admin (auth + rôle)
router.use(auth_js_1.authenticateToken, (0, auth_js_1.authorizeRoles)('ADMIN', 'SUPER_ADMIN'));
router.get('/dashboard', adminController_js_1.getDashboardMetrics);
router.get('/users', adminController_js_1.getUsers);
router.get('/transactions', adminController_js_1.getTransactions);
router.post('/transactions/:id/validate', adminController_js_1.validateTransaction);
router.post('/transactions/:id/reject', adminController_js_1.rejectTransaction);
router.post('/editions/upload-image', adminController_js_1.uploadEditionImage, adminController_js_1.handleEditionImageUpload);
router.patch('/users/:id/role', adminController_js_1.updateUserRole);
router.post('/editions', adminController_js_1.createEdition);
router.patch('/editions/:id', adminController_js_1.updateEdition);
// ─── Rapport PDF ──────────────────────────────────────────────────────────
router.get('/reports/transactions-pdf', reportController_js_1.generateTransactionsPdf);
exports.default = router;
