"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_js_1 = require("../middlewares/auth.js");
const paymentController_js_1 = require("../controllers/paymentController.js");
const router = (0, express_1.Router)();
router.post('/mobile-money/initiate', auth_js_1.authenticateToken, paymentController_js_1.initiatePaidVotePayment);
router.post('/mobile-money/webhook', paymentController_js_1.confirmPaidVoteWebhook);
exports.default = router;
