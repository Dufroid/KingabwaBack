"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVoteStatistics = exports.getMyVotes = exports.castVote = void 0;
const Vote_js_1 = require("../models/Vote.js");
const AwardEdition_js_1 = require("../models/AwardEdition.js");
const Nominee_js_1 = require("../models/Nominee.js");
const Category_js_1 = require("../models/Category.js");
const index_js_1 = require("../validators/index.js");
const castVote = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Non autorisé.' });
        }
        const { editionId, categoryId, nomineeId, voteType } = index_js_1.castVoteSchema.parse(req.body);
        if (voteType !== 'FREE') {
            return res.status(400).json({
                success: false,
                message: 'Les votes payants doivent être initiés via le paiement Mobile Money.',
            });
        }
        const edition = await AwardEdition_js_1.AwardEdition.findById(editionId);
        if (!edition) {
            return res.status(404).json({ success: false, message: 'Édition introuvable.' });
        }
        if (edition.status !== 'OPEN') {
            return res.status(400).json({
                success: false,
                message: 'Les votes pour cette édition ne sont pas actuellement ouverts.',
            });
        }
        const category = await Category_js_1.Category.findById(categoryId);
        if (!category || !category.votingEnabled) {
            return res.status(400).json({
                success: false,
                message: 'Les votes sont désactivés pour cette catégorie.',
            });
        }
        const nominee = await Nominee_js_1.Nominee.findOne({ _id: nomineeId, categoryId, status: 'ACTIVE' });
        if (!nominee) {
            return res.status(404).json({ success: false, message: 'Candidat valide introuvable.' });
        }
        const existingFreeVote = await Vote_js_1.Vote.findOne({
            userId,
            categoryId,
            editionId,
            voteType: 'FREE',
            status: { $ne: 'CANCELLED' },
        });
        if (existingFreeVote) {
            return res.status(400).json({
                success: false,
                message: 'Vous avez déjà utilisé votre vote gratuit dans cette catégorie pour cette édition.',
            });
        }
        const vote = await Vote_js_1.Vote.create({
            userId,
            editionId,
            categoryId,
            nomineeId,
            voteType: 'FREE',
            points: 1,
            status: 'CONFIRMED',
            confirmedAt: new Date(),
        });
        await Nominee_js_1.Nominee.findByIdAndUpdate(nomineeId, { $inc: { voteCount: 1 } });
        return res.status(201).json({
            success: true,
            message: `Votre vote gratuit en faveur de ${nominee.fullName} a été enregistré.`,
            vote,
        });
    }
    catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Un vote identique a déjà été enregistré pour cette combinaison.',
            });
        }
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.castVote = castVote;
const getMyVotes = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const votes = await Vote_js_1.Vote.find({ userId })
            .populate('editionId', 'name year status')
            .populate('categoryId', 'name slug icon')
            .populate('nomineeId', 'fullName profileImage slug')
            .sort({ createdAt: -1 });
        return res.json({ success: true, count: votes.length, data: votes });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getMyVotes = getMyVotes;
const getVoteStatistics = async (req, res) => {
    try {
        const confirmedVotes = await Vote_js_1.Vote.aggregate([
            { $match: { status: 'CONFIRMED', voteType: { $in: ['FREE', 'PAID'] } } },
            {
                $group: {
                    _id: '$nomineeId',
                    voteCount: { $sum: { $ifNull: ['$points', 1] } },
                },
            },
            {
                $lookup: {
                    from: 'nominees',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'nominee',
                },
            },
            { $unwind: '$nominee' },
            { $match: { 'nominee.status': 'ACTIVE' } },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'nominee.categoryId',
                    foreignField: '_id',
                    as: 'category',
                },
            },
            { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
            { $sort: { voteCount: -1 } },
            {
                $project: {
                    _id: '$nominee._id',
                    fullName: '$nominee.fullName',
                    profileImage: '$nominee.profileImage',
                    slug: '$nominee.slug',
                    voteCount: 1,
                    categoryId: { _id: '$category._id', name: '$category.name' },
                },
            },
        ]);
        const totalVotes = confirmedVotes.reduce((sum, row) => sum + row.voteCount, 0);
        const categoryStats = await Vote_js_1.Vote.aggregate([
            { $match: { status: 'CONFIRMED', voteType: { $in: ['FREE', 'PAID'] } } },
            {
                $group: {
                    _id: '$categoryId',
                    count: { $sum: 1 },
                    totalPoints: { $sum: { $ifNull: ['$points', 1] } },
                },
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'category',
                },
            },
            { $unwind: '$category' },
            {
                $project: {
                    categoryId: '$_id',
                    categoryName: '$category.name',
                    count: 1,
                    totalPoints: 1,
                },
            },
        ]);
        return res.json({
            success: true,
            totalVotes,
            categoryStats,
            topNominees: confirmedVotes.slice(0, 5),
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getVoteStatistics = getVoteStatistics;
