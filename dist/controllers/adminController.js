"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTransactions = exports.updateEdition = exports.createEdition = exports.getEditions = exports.updateUserRole = exports.getUsers = exports.getDashboardMetrics = void 0;
const User_js_1 = require("../models/User.js");
const Vote_js_1 = require("../models/Vote.js");
const Nominee_js_1 = require("../models/Nominee.js");
const Category_js_1 = require("../models/Category.js");
const BlogPost_js_1 = require("../models/BlogPost.js");
const NominationProposal_js_1 = require("../models/NominationProposal.js");
const AwardEdition_js_1 = require("../models/AwardEdition.js");
const PaymentTransaction_js_1 = require("../models/PaymentTransaction.js");
const getDashboardMetrics = async (req, res) => {
    try {
        const totalUsers = await User_js_1.User.countDocuments();
        const totalVoters = await User_js_1.User.countDocuments({ role: 'VOTER' });
        const totalVotes = await Vote_js_1.Vote.countDocuments();
        const totalNominees = await Nominee_js_1.Nominee.countDocuments({ status: 'ACTIVE' });
        const totalCategories = await Category_js_1.Category.countDocuments();
        const totalBlogPosts = await BlogPost_js_1.BlogPost.countDocuments({ status: 'PUBLISHED' });
        const totalProposals = await NominationProposal_js_1.NominationProposal.countDocuments();
        // Votes count grouped by category for visual charts
        const votesByCategory = await Vote_js_1.Vote.aggregate([
            {
                $group: {
                    _id: '$categoryId',
                    votes: { $sum: 1 },
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
                    name: '$category.name',
                    votes: 1,
                },
            },
        ]);
        const activeEdition = await AwardEdition_js_1.AwardEdition.findOne({ status: 'OPEN' });
        return res.json({
            success: true,
            metrics: {
                totalUsers,
                totalVoters,
                totalVotes,
                totalNominees,
                totalCategories,
                totalBlogPosts,
                totalProposals,
                activeEdition,
            },
            chartData: {
                votesByCategory,
            },
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getDashboardMetrics = getDashboardMetrics;
const getUsers = async (req, res) => {
    try {
        const users = await User_js_1.User.find().select('-password').sort({ createdAt: -1 });
        return res.json({ success: true, count: users.length, data: users });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getUsers = getUsers;
const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        if (!['VISITOR', 'VOTER', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Rôle invalide.' });
        }
        const updated = await User_js_1.User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
        if (!updated)
            return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
        return res.json({ success: true, data: updated });
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};
exports.updateUserRole = updateUserRole;
const getEditions = async (req, res) => {
    try {
        const editions = await AwardEdition_js_1.AwardEdition.find().sort({ year: -1 });
        console.log(editions, "eee");
        return res.json({ success: true, data: editions });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getEditions = getEditions;
const createEdition = async (req, res) => {
    try {
        const edition = await AwardEdition_js_1.AwardEdition.create(req.body);
        return res.status(201).json({ success: true, data: edition });
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};
exports.createEdition = createEdition;
const updateEdition = async (req, res) => {
    try {
        const updated = await AwardEdition_js_1.AwardEdition.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated)
            return res.status(404).json({ success: false, message: 'Édition introuvable.' });
        return res.json({ success: true, data: updated });
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};
exports.updateEdition = updateEdition;
const getTransactions = async (req, res) => {
    try {
        const transactions = await PaymentTransaction_js_1.PaymentTransaction.find()
            .sort({ createdAt: -1 })
            .populate('userId', 'firstName lastName phone email role')
            .populate('voteId', 'voteType points status nomineeId');
        return res.json({
            success: true,
            count: transactions.length,
            data: transactions.map((tx) => ({
                _id: tx._id,
                reference: tx.reference,
                provider: tx.provider,
                amount: tx.amount,
                currency: tx.currency,
                phone: tx.phone,
                status: tx.status,
                externalTransactionId: tx.externalTransactionId,
                createdAt: tx.createdAt,
                updatedAt: tx.updatedAt,
                user: tx.userId
                    ? {
                        _id: tx.userId._id,
                        fullName: `${tx.userId.firstName || ''} ${tx.userId.lastName || ''}`.trim(),
                        phone: tx.userId.phone,
                        email: tx.userId.email,
                        role: tx.userId.role,
                    }
                    : null,
                vote: tx.voteId
                    ? {
                        _id: tx.voteId._id,
                        voteType: tx.voteId.voteType,
                        points: tx.voteId.points,
                        status: tx.voteId.status,
                        nomineeId: tx.voteId.nomineeId,
                    }
                    : null,
                metadata: tx.metadata || {},
            })),
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getTransactions = getTransactions;
