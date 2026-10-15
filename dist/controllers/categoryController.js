"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.getCategoryBySlug = exports.getCategories = void 0;
const Category_js_1 = require("../models/Category.js");
const Nominee_js_1 = require("../models/Nominee.js");
const index_js_1 = require("../validators/index.js");
const getCategories = async (req, res) => {
    try {
        const categories = await Category_js_1.Category.find().sort({ order: 1 });
        // Enrich categories with nominee counts
        const categoriesWithCount = await Promise.all(categories.map(async (cat) => {
            const nomineeCount = await Nominee_js_1.Nominee.countDocuments({ categoryId: cat._id, status: 'ACTIVE' });
            return {
                ...cat.toObject(),
                nomineeCount,
            };
        }));
        return res.json({ success: true, data: categoriesWithCount });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getCategories = getCategories;
const getCategoryBySlug = async (req, res) => {
    try {
        const category = await Category_js_1.Category.findOne({ slug: req.params.slug });
        if (!category) {
            return res.status(404).json({ success: false, message: 'Catégorie introuvable.' });
        }
        const nominees = await Nominee_js_1.Nominee.find({ categoryId: category._id, status: 'ACTIVE' });
        return res.json({ success: true, category, nominees });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getCategoryBySlug = getCategoryBySlug;
const createCategory = async (req, res) => {
    try {
        const validated = index_js_1.createCategorySchema.parse(req.body);
        const slug = validated.name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-');
        const newCategory = await Category_js_1.Category.create({
            ...validated,
            slug,
        });
        return res.status(201).json({ success: true, data: newCategory });
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};
exports.createCategory = createCategory;
const updateCategory = async (req, res) => {
    try {
        const updated = await Category_js_1.Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated)
            return res.status(404).json({ success: false, message: 'Catégorie introuvable.' });
        return res.json({ success: true, data: updated });
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};
exports.updateCategory = updateCategory;
const deleteCategory = async (req, res) => {
    try {
        const deleted = await Category_js_1.Category.findByIdAndDelete(req.params.id);
        if (!deleted)
            return res.status(404).json({ success: false, message: 'Catégorie introuvable.' });
        return res.json({ success: true, message: 'Catégorie supprimée avec succès.' });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.deleteCategory = deleteCategory;
