"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWinner = exports.getWinners = void 0;
const Winner_js_1 = require("../models/Winner.js");
const getWinners = async (req, res) => {
    try {
        const { year, category } = req.query;
        const filter = {};
        if (year)
            filter.editionYear = parseInt(year, 10);
        if (category)
            filter.categoryName = { $regex: category, $options: 'i' };
        const winners = await Winner_js_1.Winner.find(filter).sort({ editionYear: -1 });
        return res.json({ success: true, data: winners });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getWinners = getWinners;
const createWinner = async (req, res) => {
    try {
        const winner = await Winner_js_1.Winner.create(req.body);
        return res.status(201).json({ success: true, data: winner });
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};
exports.createWinner = createWinner;
