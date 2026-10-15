"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const winnerController_js_1 = require("../controllers/winnerController.js");
const auth_js_1 = require("../middlewares/auth.js");
const router = (0, express_1.Router)();
router.get('/', winnerController_js_1.getWinners);
router.post('/', auth_js_1.authenticateToken, (0, auth_js_1.authorizeRoles)('ADMIN', 'SUPER_ADMIN'), winnerController_js_1.createWinner);
exports.default = router;
