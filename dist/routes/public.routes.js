"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const User_js_1 = require("../models/User.js");
const Nominee_js_1 = require("../models/Nominee.js");
const Category_js_1 = require("../models/Category.js");
const router = (0, express_1.Router)();
router.get('/stats', async (_req, res) => {
    try {
        const [totalUsers, totalNominees, totalCategories] = await Promise.all([
            User_js_1.User.countDocuments(),
            Nominee_js_1.Nominee.countDocuments({ status: 'ACTIVE' }),
            Category_js_1.Category.countDocuments(),
        ]);
        return res.json({
            success: true,
            data: {
                totalUsers,
                totalVoters: totalUsers,
                totalNominees,
                totalCategories,
            },
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Impossible de charger les statistiques publiques.',
        });
    }
});
exports.default = router;
