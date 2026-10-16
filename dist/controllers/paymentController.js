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
        const selectedProvider = provider || process.env.MOBILE_MONEY_PROVIDER || 'MOCK';
        if (!editionId || !categoryId || !nomineeId || !phone) {
            return res.status(400).json({ success: false, message: 'Données de paiement incomplètes.' });
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
        const freeVoteExists = await Vote_js_1.Vote.findOne({
            userId,
            categoryId,
            editionId,
            voteType: 'FREE',
            status: { $ne: 'CANCELLED' },
        });
        if (freeVoteExists) {
            return res.status(400).json({
                success: false,
                message: 'Vous avez déjà utilisé votre vote gratuit dans cette catégorie pour cette édition.',
            });
        }
        const reference = `KA-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
        const payment = await (0, mobileMoney_js_1.initiateMobileMoneyPayment)({
            provider: selectedProvider,
            amount: 10,
            phone,
            reference,
        });
        const vote = await Vote_js_1.Vote.create({
            userId,
            editionId,
            categoryId,
            nomineeId,
            voteType: 'PAID',
            points: 10,
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
            },
        });
        if (payment.status === 'PAID') {
            await Nominee_js_1.Nominee.findByIdAndUpdate(nomineeId, { $inc: { voteCount: 10 } });
        }
        return res.json({
            success: true,
            message: payment.status === 'PAID'
                ? `Paiement validé. ${nominee.fullName} reçoit 10 points.`
                : 'Le paiement mobile money a bien été initié. Confirmez votre transaction pour valider le vote.',
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
        if (payment.provider === 'MOCK' || payment.metadata?.otpCode) {
            if (!submittedCode) {
                return res.status(400).json({
                    success: false,
                    message: 'Le code de confirmation est obligatoire pour valider la transaction mobile money.',
                });
            }
            const expectedCode = payment.metadata?.otpCode || '';
            if (expectedCode && submittedCode !== expectedCode) {
                return res.status(400).json({
                    success: false,
                    message: 'Le code de confirmation est incorrect. Vérifiez le code reçu sur le téléphone.',
                });
            }
        }
        if (status === 'PAID' || status === 'SUCCESS' || submittedCode) {
            const confirmation = await (0, mobileMoney_js_1.confirmMobileMoneyPayment)(reference, submittedCode || undefined);
            const vote = await Vote_js_1.Vote.findById(payment.voteId);
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
            return res.json({ success: true, message: confirmation.message, payment });
        }
        payment.status = 'FAILED';
        await payment.save();
        return res.status(400).json({ success: false, message: 'Le paiement a échoué ou été annulé.' });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.confirmPaidVoteWebhook = confirmPaidVoteWebhook;
