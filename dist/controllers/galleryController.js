"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteGalleryMedia = exports.createGalleryMedia = exports.getGallery = void 0;
const GalleryMedia_js_1 = require("../models/GalleryMedia.js");
const getGallery = async (req, res) => {
    try {
        const { category, type, editionYear } = req.query;
        const filter = {};
        if (category)
            filter.category = category;
        if (type)
            filter.type = type;
        if (editionYear)
            filter.editionYear = parseInt(editionYear, 10);
        const items = await GalleryMedia_js_1.GalleryMedia.find(filter).sort({ createdAt: -1 });
        return res.json({ success: true, count: items.length, data: items });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getGallery = getGallery;
const createGalleryMedia = async (req, res) => {
    try {
        const item = await GalleryMedia_js_1.GalleryMedia.create(req.body);
        return res.status(201).json({ success: true, data: item });
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};
exports.createGalleryMedia = createGalleryMedia;
const deleteGalleryMedia = async (req, res) => {
    try {
        const deleted = await GalleryMedia_js_1.GalleryMedia.findByIdAndDelete(req.params.id);
        if (!deleted)
            return res.status(404).json({ success: false, message: 'Média introuvable.' });
        return res.json({ success: true, message: 'Média supprimé.' });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.deleteGalleryMedia = deleteGalleryMedia;
