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
        const { editionId, categoryId, nomineeId } = index_js_1.castVoteSchema.parse(req.body);
        // 1. Verify Edition status
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
        // 2. Check if Category has voting enabled
        const category = await Category_js_1.Category.findById(categoryId);
        if (!category || !category.votingEnabled) {
            return res.status(400).json({
                success: false,
                message: 'Les votes sont désactivés pour cette catégorie.',
            });
        }
        // 3. Verify Nominee exists and is active
        const nominee = await Nominee_js_1.Nominee.findOne({ _id: nomineeId, categoryId, status: 'ACTIVE' });
        if (!nominee) {
            return res.status(404).json({ success: false, message: 'Candidat valide introuvable.' });
        }
        // 4. Check for existing vote by this user in this category and edition
        const existingVote = await Vote_js_1.Vote.findOne({ userId, categoryId, editionId });
        if (existingVote) {
            return res.status(400).json({
                success: false,
                message: 'Vous avez déjà voté dans cette catégorie pour cette édition !',
            });
        }
        // 5. Register Vote and increment vote count on Nominee
        const vote = await Vote_js_1.Vote.create({
            userId,
            editionId,
            categoryId,
            nomineeId,
        });
        await Nominee_js_1.Nominee.findByIdAndUpdate(nomineeId, { $inc: { voteCount: 1 } });
        return res.status(201).json({
            success: true,
            message: `Votre vote en faveur de ${nominee.fullName} dans la catégorie "${category.name}" a été enregistré avec succès !`,
            vote,
        });
    }
    catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Vous avez déjà enregistré un vote dans cette catégorie.',
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
        const totalVotes = await Vote_js_1.Vote.countDocuments();
        // Aggregation of votes by category
        const categoryStats = await Vote_js_1.Vote.aggregate([
            {
                $group: {
                    _id: '$categoryId',
                    count: { $sum: 1 },
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
                },
            },
        ]);
        // Top voted nominees
        const topNominees = await Nominee_js_1.Nominee.find({ status: 'ACTIVE' })
            .sort({ voteCount: -1 })
            .limit(5)
            .populate('categoryId', 'name');
        return res.json({
            success: true,
            totalVotes,
            categoryStats,
            topNominees,
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getVoteStatistics = getVoteStatistics;
