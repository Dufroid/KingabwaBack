"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNominee = exports.updateNominee = exports.createNominee = exports.getNomineeBySlug = exports.getNominees = exports.handleNomineeImageUpload = exports.uploadNomineeImage = void 0;
const multer_1 = __importDefault(require("multer"));
const Nominee_js_1 = require("../models/Nominee.js");
const Vote_js_1 = require("../models/Vote.js");
const cloudinary_js_1 = require("../config/cloudinary.js");
const index_js_1 = require("../validators/index.js");
const getConfirmedVoteCounts = async (nomineeIds) => {
    if (nomineeIds.length === 0)
        return new Map();
    const rows = await Vote_js_1.Vote.aggregate([
        {
            $match: {
                nomineeId: { $in: nomineeIds },
                status: 'CONFIRMED',
                voteType: { $in: ['FREE', 'PAID'] },
            },
        },
        {
            $group: {
                _id: '$nomineeId',
                voteCount: { $sum: { $ifNull: ['$points', 1] } },
            },
        },
    ]);
    return new Map(rows.map((row) => [String(row._id), row.voteCount]));
};
exports.uploadNomineeImage = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
    fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            cb(new Error('Seules les images sont autorisées.'));
            return;
        }
        cb(null, true);
    },
}).single('image');
const handleNomineeImageUpload = async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ success: false, message: 'Aucune image fournie.' });
        }
        let uploadResult;
        if (cloudinary_js_1.isCloudinaryConfigured) {
            uploadResult = await (0, cloudinary_js_1.uploadToCloudinary)(file, 'kingabwa/nominees');
        }
        else {
            uploadResult = (0, cloudinary_js_1.buildLocalUploadResponse)(file, 'nominees');
        }
        return res.status(200).json({
            success: true,
            data: {
                url: uploadResult.url,
                relativePath: uploadResult.relativePath || null,
                fileName: uploadResult.fileName || uploadResult.publicId || 'nominee-image',
            },
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.handleNomineeImageUpload = handleNomineeImageUpload;
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
        const voteCounts = await getConfirmedVoteCounts(nominees.map((nominee) => nominee._id));
        return res.json({
            success: true,
            count: nominees.length,
            data: nominees.map((nominee) => ({
                ...nominee.toObject(),
                voteCount: voteCounts.get(String(nominee._id)) ?? 0,
            })),
        });
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
        const voteCounts = await getConfirmedVoteCounts([nominee._id]);
        return res.json({
            success: true,
            data: {
                ...nominee.toObject(),
                voteCount: voteCounts.get(String(nominee._id)) ?? 0,
            },
        });
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
