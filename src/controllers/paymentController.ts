import { Request, Response } from 'express';
import { AuthRequest } from '../types/index.js';
import { Vote } from '../models/Vote.js';
import { PaymentTransaction } from '../models/PaymentTransaction.js';
import { Nominee } from '../models/Nominee.js';
import { AwardEdition } from '../models/AwardEdition.js';
import { Category } from '../models/Category.js';
import { initiatePaidVoteSchema } from '../validators/index.js';
import {
  MIN_VOICES_PER_PAYMENT,
  MAX_VOICES_PER_PAYMENT,
  VOICE_PRICE_CDF,
  getManualPaymentMethods,
  getProviderInfo,
} from '../config/manualPayment.js';
import { getVotingWindowMessage, isVotingWindowOpen } from '../config/votingWindow.js';

/** Retourne le paiement PENDING en cours pour cet utilisateur/candidat */
const getPendingTransaction = (
  userId: string,
  editionId: string,
  categoryId: string,
  nomineeId: string
) =>
  PaymentTransaction.findOne({
    userId,
    'metadata.nomineeId': nomineeId,
    'metadata.categoryId': categoryId,
    'metadata.editionId': editionId,
    status: 'PENDING',
  }).sort({ createdAt: -1 });

export const getPaymentMethods = async (_req: Request, res: Response) => {
  return res.json({ success: true, data: getManualPaymentMethods() });
};

export const getPaidVoteContext = async (req: AuthRequest, res: Response) => {
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
        minIncrements: MIN_VOICES_PER_PAYMENT,
        maxIncrements: MAX_VOICES_PER_PAYMENT,
        pricePerIncrement: VOICE_PRICE_CDF,
        currency: 'CDF',
        hasPendingPayment: Boolean(pendingPayment),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const initiatePaidVotePayment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Non autorisé.' });
    }

    const validated = initiatePaidVoteSchema.parse(req.body);
    const { editionId, categoryId, nomineeId, provider, increments } = validated;

    // Vérification édition ouverte
    const edition = await AwardEdition.findById(editionId);
    if (!edition || edition.status !== 'OPEN') {
      return res.status(400).json({ success: false, message: "L\u2019édition n\u2019est pas ouverte au vote." });
    }

    // Vérification fenêtre de vote
    if (!isVotingWindowOpen()) {
      return res.status(400).json({ success: false, message: getVotingWindowMessage() });
    }

    // Vérification catégorie active
    const category = await Category.findById(categoryId);
    if (!category || !category.votingEnabled) {
      return res.status(400).json({ success: false, message: 'Cette catégorie ne reçoit plus de votes.' });
    }

    // Vérification nominé actif
    const nominee = await Nominee.findOne({ _id: nomineeId, categoryId, status: 'ACTIVE' });
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
    if (increments < MIN_VOICES_PER_PAYMENT || increments > MAX_VOICES_PER_PAYMENT) {
      return res.status(400).json({
        success: false,
        message: `Vous pouvez acheter entre ${MIN_VOICES_PER_PAYMENT} et ${MAX_VOICES_PER_PAYMENT} voix par paiement.`,
      });
    }

    const providerInfo = getProviderInfo(provider);
    if (!providerInfo.phone) {
      return res.status(503).json({
        success: false,
        message: `Le numéro de réception ${providerInfo.label} n'est pas configuré. Contactez l'organisation.`,
      });
    }

    const amount = increments * VOICE_PRICE_CDF;

    // Création du vote en attente
    const vote = await Vote.create({
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
    const payment = await PaymentTransaction.create({
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
        merchantName: getManualPaymentMethods().merchantName,
        amount,
        currency: 'CDF',
        increments,
        status: payment.status,
        instructions,
      },
    });
  } catch (error: any) {
    if (error.errors) {
      return res.status(400).json({ success: false, message: error.errors[0].message });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};
