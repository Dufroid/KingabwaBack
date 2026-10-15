"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNominee = exports.updateNominee = exports.createNominee = exports.getNomineeBySlug = exports.getNominees = void 0;
const Nominee_js_1 = require("../models/Nominee.js");
const index_js_1 = require("../validators/index.js");
const getNominees = async (req, res) => {
    try {
        const { categoryId, editionId, search } = req.query;
        const filter = { status: 'ACTIVE' };
        if (categoryId)
            filter.categoryId = categoryId;
        if (editionId)
            filter.editionId = editionId;
        if (search) {
            filter.fullName = { $regex: search, $options: 'i' };
        }
        const nominees = await Nominee_js_1.Nominee.find(filter)
            .populate('categoryId', 'name slug icon')
            .populate('editionId', 'name year status');
        return res.json({ success: true, count: nominees.length, data: nominees });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getNominees = getNominees;
const getNomineeBySlug = async (req, res) => {
    try {
        const nominee = await Nominee_js_1.Nominee.findOne({ slug: req.params.slug })
            .populate('categoryId', 'name slug description icon')
            .populate('editionId', 'name year votingStartDate votingEndDate status');
        if (!nominee) {
            return res.status(404).json({ success: false, message: 'Candidat introuvable.' });
        }
        return res.json({ success: true, data: nominee });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getNomineeBySlug = getNomineeBySlug;
const createNominee = async (req, res) => {
    try {
        const validated = index_js_1.createNomineeSchema.parse(req.body);
        const slug = validated.fullName
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-');
        const newNominee = await Nominee_js_1.Nominee.create({
            ...validated,
            slug,
        });
        return res.status(201).json({ success: true, data: newNominee });
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};
exports.createNominee = createNominee;
const updateNominee = async (req, res) => {
    try {
        const updated = await Nominee_js_1.Nominee.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated)
            return res.status(404).json({ success: false, message: 'Candidat introuvable.' });
        return res.json({ success: true, data: updated });
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};
exports.updateNominee = updateNominee;
const deleteNominee = async (req, res) => {
    try {
        const deleted = await Nominee_js_1.Nominee.findByIdAndDelete(req.params.id);
        if (!deleted)
            return res.status(404).json({ success: false, message: 'Candidat introuvable.' });
        return res.json({ success: true, message: 'Candidat supprimé avec succès.' });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.deleteNominee = deleteNominee;
