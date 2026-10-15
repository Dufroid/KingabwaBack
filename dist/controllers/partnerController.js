"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePartner = exports.updatePartner = exports.createPartner = exports.getPartners = void 0;
const Partner_js_1 = require("../models/Partner.js");
const getPartners = async (req, res) => {
    try {
        const partners = await Partner_js_1.Partner.find({ active: true }).sort({ order: 1 });
        return res.json({ success: true, data: partners });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getPartners = getPartners;
const createPartner = async (req, res) => {
    try {
        const newPartner = await Partner_js_1.Partner.create(req.body);
        return res.status(201).json({ success: true, data: newPartner });
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};
exports.createPartner = createPartner;
const updatePartner = async (req, res) => {
    try {
        const updated = await Partner_js_1.Partner.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated)
            return res.status(404).json({ success: false, message: 'Partenaire introuvable.' });
        return res.json({ success: true, data: updated });
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};
exports.updatePartner = updatePartner;
const deletePartner = async (req, res) => {
    try {
        const deleted = await Partner_js_1.Partner.findByIdAndDelete(req.params.id);
        if (!deleted)
            return res.status(404).json({ success: false, message: 'Partenaire introuvable.' });
        return res.json({ success: true, message: 'Partenaire supprimé.' });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.deletePartner = deletePartner;
