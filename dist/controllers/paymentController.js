"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmPaidVoteWebhook = exports.initiatePaidVotePayment = void 0;
const Vote_js_1 = require("../models/Vote.js");
const PaymentTransaction_js_1 = require("../models/PaymentTransaction.js");
const Nominee_js_1 = require("../models/Nominee.js");
const AwardEdition_js_1 = require("../models/AwardEdition.js");
const Category_js_1 = require("../models/Category.js");
const mobileMoney_js_1 = require("../config/mobileMoney.js");
const initiatePaidVotePayment = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Non autorisé.' });
        }
        const { editionId, categoryId, nomineeId, phone, provider } = req.body;
        let increments = Number(req.body.increments ?? req.body.amountIncrements ?? 0);
        if (!Number.isInteger(increments) || increments <= 0)
            increments = 10; // default to 10 if not provided
        const selectedProvider = provider || process.env.MOBILE_MONEY_PROVIDER || 'MOCK';
        if (!editionId || !categoryId || !nomineeId || !phone) {
            return res.status(400).json({ success: false, message: 'Données de paiement incomplètes.' });
        }
        if (increments < 1 || increments > 10) {
            return res.status(400).json({ success: false, message: 'Les incréments doivent être entre 1 et 10.' });
        }
        const edition = await AwardEdition_js_1.AwardEdition.findById(editionId);
        if (!edition || edition.status !== 'OPEN') {
            return res.status(400).json({ success: false, message: 'L’édition n’est pas ouverte au vote.' });
        }
        const category = await Category_js_1.Category.findById(categoryId);
        if (!category || !category.votingEnabled) {
            return res.status(400).json({ success: false, message: 'Cette catégorie ne reçoit plus de votes.' });
        }
        const nominee = await Nominee_js_1.Nominee.findOne({ _id: nomineeId, categoryId, status: 'ACTIVE' });
        if (!nominee) {
            return res.status(404).json({ success: false, message: 'Candidat introuvable.' });
        }
        // Free vote should NOT block paid votes. Remove any blocking logic here.
        // Check if user already made a PAID transaction for this nominee/category/edition
        const previousPaid = await PaymentTransaction_js_1.PaymentTransaction.findOne({
            userId,
            'metadata.nomineeId': nomineeId,
            'metadata.categoryId': categoryId,
            'metadata.editionId': editionId,
            status: 'PAID',
        });
        // Enforce first paid transaction must be exactly 10 increments
        if (!previousPaid && increments !== 10) {
            return res.status(400).json({
                success: false,
                message: 'La première transaction payante pour ce candidat doit être de 10 incréments (5000 FC).',
            });
        }
        const amount = increments * 500; // price per increment: 500 FC
        const reference = `KA-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
        const payment = await (0, mobileMoney_js_1.initiateMobileMoneyPayment)({
            provider: selectedProvider,
            amount,
            phone,
            reference,
        });
        // create a PAID vote record (status PENDING if payment not yet confirmed)
        const vote = await Vote_js_1.Vote.create({
            userId,
            editionId,
            categoryId,
            nomineeId,
            voteType: 'PAID',
            points: increments,
            status: payment.status === 'PAID' ? 'CONFIRMED' : 'PENDING',
            paymentReference: reference,
            confirmedAt: payment.status === 'PAID' ? new Date() : null,
        });
        await PaymentTransaction_js_1.PaymentTransaction.create({
            userId,
            voteId: vote._id,
            provider: payment.provider,
            amount: payment.amount,
            currency: 'CDF',
            phone: payment.phone,
            status: payment.status === 'PAID' ? 'PAID' : 'PENDING',
            reference,
            externalTransactionId: payment.externalTransactionId,
            metadata: {
                editionId,
                categoryId,
                nomineeId,
                otpCode: payment.otpCode || '',
                increments,
                amountCdf: payment.amount,
                providerLabel: payment.providerLabel || selectedProvider,
            },
        });
        if (payment.status === 'PAID') {
            await Nominee_js_1.Nominee.findByIdAndUpdate(nomineeId, { $inc: { voteCount: increments } });
        }
        return res.json({
            success: true,
            message: payment.status === 'PAID'
                ? `Paiement validé. ${nominee.fullName} reçoit ${increments} point(s).`
                : `Le paiement mobile money a bien été initié pour ${amount} FC. Confirmez votre transaction pour valider le vote.`,
            payment,
            vote,
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.initiatePaidVotePayment = initiatePaidVotePayment;
const confirmPaidVoteWebhook = async (req, res) => {
    try {
        const { reference, status, otpCode, code } = req.body || {};
        const submittedCode = (otpCode ?? code ?? '').toString().trim();
        if (!reference) {
            return res.status(400).json({ success: false, message: 'Référence de paiement requise.' });
        }
        const payment = await PaymentTransaction_js_1.PaymentTransaction.findOne({ reference });
        if (!payment) {
            return res.status(404).json({ success: false, message: 'Transaction introuvable.' });
        }
        const expectedCode = payment.metadata?.otpCode?.trim() || '';
        if (expectedCode || payment.provider === 'MOCK') {
            if (!submittedCode) {
                return res.status(400).json({
                    success: false,
                    message: 'Le code de confirmation est obligatoire pour valider la transaction mobile money.',
                });
            }
            if (expectedCode && submittedCode !== expectedCode) {
                return res.status(400).json({
                    success: false,
                    message: 'Le code de confirmation est incorrect. Vérifiez le code reçu sur le téléphone.',
                });
            }
        }
        const confirmation = await (0, mobileMoney_js_1.confirmMobileMoneyPayment)(reference, submittedCode || undefined);
        if (!confirmation.success) {
            payment.status = 'FAILED';
            await payment.save();
            return res.status(400).json({ success: false, message: confirmation.message, payment });
        }
        let vote = null;
        if (payment.voteId) {
            vote = await Vote_js_1.Vote.findById(payment.voteId);
        }
        if (!vote) {
            vote = await Vote_js_1.Vote.findOne({
                userId: payment.userId,
                editionId: payment.metadata?.editionId,
                categoryId: payment.metadata?.categoryId,
                nomineeId: payment.metadata?.nomineeId,
                voteType: 'PAID',
                status: { $ne: 'CANCELLED' },
            }).sort({ createdAt: -1 });
        }
        if (vote && vote.status !== 'CONFIRMED') {
            vote.status = 'CONFIRMED';
            vote.confirmedAt = new Date();
            await vote.save();
            await Nominee_js_1.Nominee.findByIdAndUpdate(vote.nomineeId, { $inc: { voteCount: vote.points } });
        }
        payment.status = 'PAID';
        if (payment.metadata) {
            payment.metadata.otpCode = payment.metadata.otpCode || submittedCode || '';
        }
        await payment.save();
        if (vote && vote.status === 'CONFIRMED') {
            return res.json({
                success: true,
                message: confirmation.message || `Paiement validé. ${vote.points} point(s) ont été ajoutés au candidat.`,
                payment,
                vote,
            });
        }
        return res.status(400).json({
            success: false,
            message: 'La transaction a été validée mais aucun vote n’a pu être confirmé.',
            payment,
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.confirmPaidVoteWebhook = confirmPaidVoteWebhook;
