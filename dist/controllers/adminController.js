"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectTransaction = exports.validateTransaction = exports.getTransactions = exports.updateEdition = exports.createEdition = exports.getEditions = exports.updateUserRole = exports.getUsers = exports.getDashboardMetrics = exports.handleEditionImageUpload = exports.uploadEditionImage = void 0;
const multer_1 = __importDefault(require("multer"));
const User_js_1 = require("../models/User.js");
const Vote_js_1 = require("../models/Vote.js");
const Nominee_js_1 = require("../models/Nominee.js");
const Category_js_1 = require("../models/Category.js");
const BlogPost_js_1 = require("../models/BlogPost.js");
const NominationProposal_js_1 = require("../models/NominationProposal.js");
const AwardEdition_js_1 = require("../models/AwardEdition.js");
const PaymentTransaction_js_1 = require("../models/PaymentTransaction.js");
const cloudinary_js_1 = require("../config/cloudinary.js");
exports.uploadEditionImage = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            cb(new Error('Seules les images sont autorisées.'));
            return;
        }
        cb(null, true);
    },
}).single('image');
const handleEditionImageUpload = async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ success: false, message: 'Aucune image fournie.' });
        }
        let uploadResult;
        if (cloudinary_js_1.isCloudinaryConfigured) {
            uploadResult = await (0, cloudinary_js_1.uploadToCloudinary)(file, 'kingabwa/editions');
        }
        else {
            uploadResult = (0, cloudinary_js_1.buildLocalUploadResponse)(file, 'editions');
        }
        return res.status(200).json({
            success: true,
            data: {
                url: uploadResult.url,
                relativePath: uploadResult.relativePath || null,
                fileName: uploadResult.fileName || uploadResult.publicId || 'edition-image',
            },
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.handleEditionImageUpload = handleEditionImageUpload;
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
            .populate('userId', 'firstName lastName phone role')
            .populate({
            path: 'voteId',
            select: 'voteType points status nomineeId categoryId editionId confirmedAt',
            populate: [
                { path: 'nomineeId', select: 'fullName profileImage' },
                { path: 'categoryId', select: 'name' },
                { path: 'editionId', select: 'name year' },
            ],
        });
        return res.json({
            success: true,
            count: transactions.length,
            data: transactions.map((tx) => ({
                _id: tx._id,
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
                        nomineeName: tx.voteId.nomineeId?.fullName || null,
                        categoryName: tx.voteId.categoryId?.name || null,
                        editionName: tx.voteId.editionId?.name || null,
                        confirmedAt: tx.voteId.confirmedAt,
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
const confirmVoteFromTransaction = async (payment) => {
    let vote = payment.voteId ? await Vote_js_1.Vote.findById(payment.voteId) : null;
    if (!vote) {
        vote = await Vote_js_1.Vote.findOne({
            userId: payment.userId,
            editionId: payment.metadata?.editionId,
            categoryId: payment.metadata?.categoryId,
            nomineeId: payment.metadata?.nomineeId,
            voteType: 'PAID',
            status: 'PENDING',
        }).sort({ createdAt: -1 });
    }
    if (!vote)
        return null;
    const confirmedVote = await Vote_js_1.Vote.findOneAndUpdate({ _id: vote._id, status: 'PENDING' }, { $set: { status: 'CONFIRMED', confirmedAt: new Date() } }, { new: true });
    if (!confirmedVote)
        return null;
    const nominee = await Nominee_js_1.Nominee.findByIdAndUpdate(confirmedVote.nomineeId, { $inc: { voteCount: confirmedVote.points } }, { new: true });
    return { vote: confirmedVote, nominee };
};
const validateTransaction = async (req, res) => {
    try {
        const payment = await PaymentTransaction_js_1.PaymentTransaction.findOneAndUpdate({ _id: req.params.id, status: 'PENDING' }, {
            $set: {
                status: 'PAID',
                'metadata.validatedBy': req.user?.userId || '',
                'metadata.validatedAt': new Date(),
            },
        }, { new: true });
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Transaction en attente introuvable ou déjà traitée.',
            });
        }
        const confirmation = await confirmVoteFromTransaction(payment);
        return res.json({
            success: true,
            message: confirmation
                ? `Paiement validé. ${confirmation.vote.points} voix ont été ajoutées à ${confirmation.nominee?.fullName || 'ce candidat'}.`
                : 'Paiement marqué comme validé, mais aucun vote en attente n’a pu être confirmé.',
            payment,
            vote: confirmation?.vote || null,
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.validateTransaction = validateTransaction;
const rejectTransaction = async (req, res) => {
    try {
        const reason = (req.body?.reason || '').toString().trim();
        const payment = await PaymentTransaction_js_1.PaymentTransaction.findOneAndUpdate({ _id: req.params.id, status: 'PENDING' }, {
            $set: {
                status: 'FAILED',
                'metadata.rejectedBy': req.user?.userId || '',
                'metadata.rejectedAt': new Date(),
                'metadata.rejectionReason': reason,
            },
        }, { new: true });
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Transaction en attente introuvable ou déjà traitée.',
            });
        }
        if (payment.voteId) {
            await Vote_js_1.Vote.findOneAndUpdate({ _id: payment.voteId, status: 'PENDING' }, { $set: { status: 'CANCELLED' } });
        }
        return res.json({
            success: true,
            message: 'Paiement rejeté. Le vote associé a été annulé.',
            payment,
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.rejectTransaction = rejectTransaction;
