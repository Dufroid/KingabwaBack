"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initiatePaidVotePayment = exports.getPaidVoteContext = exports.getPaymentMethods = void 0;
const Vote_js_1 = require("../models/Vote.js");
const PaymentTransaction_js_1 = require("../models/PaymentTransaction.js");
const Nominee_js_1 = require("../models/Nominee.js");
const AwardEdition_js_1 = require("../models/AwardEdition.js");
const Category_js_1 = require("../models/Category.js");
const index_js_1 = require("../validators/index.js");
const manualPayment_js_1 = require("../config/manualPayment.js");
const votingWindow_js_1 = require("../config/votingWindow.js");
/** Retourne le paiement PENDING en cours pour cet utilisateur/candidat */
const getPendingTransaction = (userId, editionId, categoryId, nomineeId) => PaymentTransaction_js_1.PaymentTransaction.findOne({
    userId,
    'metadata.nomineeId': nomineeId,
    'metadata.categoryId': categoryId,
    'metadata.editionId': editionId,
    status: 'PENDING',
}).sort({ createdAt: -1 });
const getPaymentMethods = async (_req, res) => {
    return res.json({ success: true, data: (0, manualPayment_js_1.getManualPaymentMethods)() });
};
exports.getPaymentMethods = getPaymentMethods;
const getPaidVoteContext = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const editionId = String(req.query.editionId || '');
        const categoryId = String(req.query.categoryId || '');
        const nomineeId = String(req.query.nomineeId || '');
        if (!userId || !editionId || !categoryId || !nomineeId) {
            return res.status(400).json({ success: false, message: 'Contexte de vote incomplet.' });
        }
        const pendingPayment = await getPendingTransaction(userId, editionId, categoryId, nomineeId);
        return res.json({
            success: true,
            data: {
                minIncrements: manualPayment_js_1.MIN_VOICES_PER_PAYMENT,
                maxIncrements: manualPayment_js_1.MAX_VOICES_PER_PAYMENT,
                pricePerIncrement: manualPayment_js_1.VOICE_PRICE_CDF,
                currency: 'CDF',
                hasPendingPayment: Boolean(pendingPayment),
            },
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getPaidVoteContext = getPaidVoteContext;
const initiatePaidVotePayment = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Non autorisé.' });
        }
        const validated = index_js_1.initiatePaidVoteSchema.parse(req.body);
        const { editionId, categoryId, nomineeId, provider, increments } = validated;
        // Vérification édition ouverte
        const edition = await AwardEdition_js_1.AwardEdition.findById(editionId);
        if (!edition || edition.status !== 'OPEN') {
            return res.status(400).json({ success: false, message: "L\u2019édition n\u2019est pas ouverte au vote." });
        }
        // Vérification fenêtre de vote
        if (!(0, votingWindow_js_1.isVotingWindowOpen)()) {
            return res.status(400).json({ success: false, message: (0, votingWindow_js_1.getVotingWindowMessage)() });
        }
        // Vérification catégorie active
        const category = await Category_js_1.Category.findById(categoryId);
        if (!category || !category.votingEnabled) {
            return res.status(400).json({ success: false, message: 'Cette catégorie ne reçoit plus de votes.' });
        }
        // Vérification nominé actif
        const nominee = await Nominee_js_1.Nominee.findOne({ _id: nomineeId, categoryId, status: 'ACTIVE' });
        if (!nominee) {
            return res.status(404).json({ success: false, message: 'Candidat introuvable.' });
        }
        // Vérification qu'aucun paiement PENDING n'est déjà en cours pour ce candidat
        const pendingPayment = await getPendingTransaction(userId, editionId, categoryId, nomineeId);
        if (pendingPayment) {
            return res.status(400).json({
                success: false,
                message: "Vous avez déjà un paiement en attente de validation pour ce candidat. Patientez jusqu\u2019\u00e0 sa validation avant d\u2019en soumettre un nouveau.",
            });
        }
        // Validation du nombre de voix (1 à 300)
        if (increments < manualPayment_js_1.MIN_VOICES_PER_PAYMENT || increments > manualPayment_js_1.MAX_VOICES_PER_PAYMENT) {
            return res.status(400).json({
                success: false,
                message: `Vous pouvez acheter entre ${manualPayment_js_1.MIN_VOICES_PER_PAYMENT} et ${manualPayment_js_1.MAX_VOICES_PER_PAYMENT} voix par paiement.`,
            });
        }
        const providerInfo = (0, manualPayment_js_1.getProviderInfo)(provider);
        if (!providerInfo.phone) {
            return res.status(503).json({
                success: false,
                message: `Le numéro de réception ${providerInfo.label} n'est pas configuré. Contactez l'organisation.`,
            });
        }
        const amount = increments * manualPayment_js_1.VOICE_PRICE_CDF;
        // Création du vote en attente
        const vote = await Vote_js_1.Vote.create({
            userId,
            editionId,
            categoryId,
            nomineeId,
            voteType: 'PAID',
            points: increments,
            status: 'PENDING',
            confirmedAt: null,
        });
        // Création de la transaction de paiement
        const payment = await PaymentTransaction_js_1.PaymentTransaction.create({
            userId,
            voteId: vote._id,
            provider,
            amount,
            currency: 'CDF',
            phone: providerInfo.phone,
            status: 'PENDING',
            externalTransactionId: '',
            metadata: {
                editionId,
                categoryId,
                nomineeId,
                increments,
                amountCdf: amount,
                providerLabel: providerInfo.label,
                merchantPhone: providerInfo.phone,
            },
        });
        const instructions = `Envoyez ${amount.toLocaleString('fr-CD')} FC au numéro ${providerInfo.phone} (${providerInfo.operator}). Votre paiement sera vérifié par l'administrateur.`;
        return res.status(201).json({
            success: true,
            message: "Paiement enregistré. Votre vote sera validé dès vérification du transfert par l\u2019administrateur.",
            payment: {
                provider,
                providerLabel: providerInfo.label,
                operator: providerInfo.operator,
                merchantPhone: providerInfo.phone,
                merchantName: (0, manualPayment_js_1.getManualPaymentMethods)().merchantName,
                amount,
                currency: 'CDF',
                increments,
                status: payment.status,
                instructions,
            },
        });
    }
    catch (error) {
        if (error.errors) {
            return res.status(400).json({ success: false, message: error.errors[0].message });
        }
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.initiatePaidVotePayment = initiatePaidVotePayment;
