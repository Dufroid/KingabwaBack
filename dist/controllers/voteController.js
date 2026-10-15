"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVoteStatistics = exports.getMyVotes = exports.confirmPaidVote = exports.castVote = void 0;
const Vote_js_1 = require("../models/Vote.js");
const AwardEdition_js_1 = require("../models/AwardEdition.js");
const Nominee_js_1 = require("../models/Nominee.js");
const Category_js_1 = require("../models/Category.js");
const index_js_1 = require("../validators/index.js");
const getVotePoints = (voteType) => voteType === 'FREE' ? 1 : 10;
const castVote = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Non autorisé.' });
        }
        const { editionId, categoryId, nomineeId, voteType, paymentReference } = index_js_1.castVoteSchema.parse(req.body);
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
        if (voteType === 'FREE') {
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
        }
        const points = getVotePoints(voteType);
        const status = voteType === 'FREE' ? 'CONFIRMED' : 'PENDING';
        const vote = await Vote_js_1.Vote.create({
            userId,
            editionId,
            categoryId,
            nomineeId,
            voteType,
            points,
            status,
            paymentReference: paymentReference || '',
            confirmedAt: status === 'CONFIRMED' ? new Date() : null,
        });
        if (status === 'CONFIRMED') {
            await Nominee_js_1.Nominee.findByIdAndUpdate(nomineeId, { $inc: { voteCount: points } });
        }
        const message = voteType === 'FREE'
            ? `Votre vote gratuit en faveur de ${nominee.fullName} a été enregistré.`
            : `Votre vote payant a été enregistré et sera comptabilisé après confirmation du paiement.`;
        return res.status(201).json({ success: true, message, vote });
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
const confirmPaidVote = async (req, res) => {
    try {
        const { voteId } = req.params;
        const vote = await Vote_js_1.Vote.findById(voteId);
        if (!vote) {
            return res.status(404).json({ success: false, message: 'Vote introuvable.' });
        }
        if (vote.voteType !== 'PAID') {
            return res.status(400).json({ success: false, message: 'Cette action est réservée aux votes payants.' });
        }
        if (vote.status === 'CONFIRMED') {
            return res.status(400).json({ success: false, message: 'Ce vote a déjà été confirmé.' });
        }
        const nominee = await Nominee_js_1.Nominee.findById(vote.nomineeId);
        if (!nominee) {
            return res.status(404).json({ success: false, message: 'Candidat associé introuvable.' });
        }
        vote.status = 'CONFIRMED';
        vote.confirmedAt = new Date();
        await vote.save();
        await Nominee_js_1.Nominee.findByIdAndUpdate(vote.nomineeId, { $inc: { voteCount: vote.points } });
        return res.json({
            success: true,
            message: `Paiement validé. ${vote.points} points ont été ajoutés à ${nominee.fullName}.`,
            vote,
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.confirmPaidVote = confirmPaidVote;
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
        const totalVotes = await Vote_js_1.Vote.countDocuments({ status: 'CONFIRMED' });
        const categoryStats = await Vote_js_1.Vote.aggregate([
            { $match: { status: 'CONFIRMED' } },
            {
                $group: {
                    _id: '$categoryId',
                    count: { $sum: 1 },
                    totalPoints: { $sum: '$points' },
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
