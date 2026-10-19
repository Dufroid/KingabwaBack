import { Request, Response } from 'express';
import { AuthRequest } from '../types/index.js';
import { Vote } from '../models/Vote.js';
import { PaymentTransaction } from '../models/PaymentTransaction.js';
import { Nominee } from '../models/Nominee.js';
import { AwardEdition } from '../models/AwardEdition.js';
import { Category } from '../models/Category.js';
import { declarePaidVoteSchema, initiatePaidVoteSchema } from '../validators/index.js';
import {
  FIRST_PURCHASE_VOICES,
  MAX_VOICES_PER_PAYMENT,
  VOICE_PRICE_CDF,
  getManualPaymentMethods,
  getProviderInfo,
} from '../config/manualPayment.js';

const getPreviousPaidTransaction = (
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
    status: 'PAID',
  });

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

const buildReference = () => {
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `KA-${Date.now().toString(36).toUpperCase()}-${randomPart}`;
};

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

    const [previousPaid, pendingPayment] = await Promise.all([
      getPreviousPaidTransaction(userId, editionId, categoryId, nomineeId),
      getPendingTransaction(userId, editionId, categoryId, nomineeId),
    ]);

    return res.json({
      success: true,
      data: {
        firstPurchase: !previousPaid,
        minIncrements: previousPaid ? 1 : FIRST_PURCHASE_VOICES,
        maxIncrements: MAX_VOICES_PER_PAYMENT,
        lockedIncrements: previousPaid ? null : FIRST_PURCHASE_VOICES,
        pricePerIncrement: VOICE_PRICE_CDF,
        currency: 'CDF',
        hasPendingPayment: Boolean(pendingPayment),
        pendingReference: pendingPayment?.reference || null,
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

    const edition = await AwardEdition.findById(editionId);
    if (!edition || edition.status !== 'OPEN') {
      return res.status(400).json({ success: false, message: 'L’édition n’est pas ouverte au vote.' });
    }

    const category = await Category.findById(categoryId);
    if (!category || !category.votingEnabled) {
      return res.status(400).json({ success: false, message: 'Cette catégorie ne reçoit plus de votes.' });
    }

    const nominee = await Nominee.findOne({ _id: nomineeId, categoryId, status: 'ACTIVE' });
    if (!nominee) {
      return res.status(404).json({ success: false, message: 'Candidat introuvable.' });
    }

    const [previousPaid, pendingPayment] = await Promise.all([
      getPreviousPaidTransaction(userId, editionId, categoryId, nomineeId),
      getPendingTransaction(userId, editionId, categoryId, nomineeId),
    ]);

    if (pendingPayment) {
      return res.status(400).json({
        success: false,
        message: `Vous avez déjà un paiement en attente de validation (référence ${pendingPayment.reference}).`,
      });
    }

    if (!previousPaid && increments !== FIRST_PURCHASE_VOICES) {
      return res.status(400).json({
        success: false,
        message: `La première transaction payante doit être de ${FIRST_PURCHASE_VOICES} voix (${FIRST_PURCHASE_VOICES * VOICE_PRICE_CDF} FC).`,
      });
    }

    if (previousPaid && (increments < 1 || increments > MAX_VOICES_PER_PAYMENT)) {
      return res.status(400).json({
        success: false,
        message: `Vous pouvez acheter entre 1 et ${MAX_VOICES_PER_PAYMENT} voix par paiement.`,
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
    const reference = buildReference();

    const vote = await Vote.create({
      userId,
      editionId,
      categoryId,
      nomineeId,
      voteType: 'PAID',
      points: increments,
      status: 'PENDING',
      paymentReference: reference,
      confirmedAt: null,
    });

    const payment = await PaymentTransaction.create({
      userId,
      voteId: vote._id,
      provider,
      amount,
      currency: 'CDF',
      phone: providerInfo.phone,
      status: 'PENDING',
      reference,
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

    const instructions = `Envoyez ${amount} FC au numéro ${providerInfo.phone} (${providerInfo.operator}) en indiquant la référence ${reference} dans le motif, puis saisissez l'ID de transaction reçu par SMS.`;

    return res.status(201).json({
      success: true,
      message: 'Demande de paiement créée. Effectuez le transfert puis déclarez votre transaction.',
      payment: {
        reference,
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
      vote,
    });
  } catch (error: any) {
    if (error.errors) {
      return res.status(400).json({ success: false, message: error.errors[0].message });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const declarePaidVotePayment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Non autorisé.' });
    }

    const { reference, payerPhone, transactionId } = declarePaidVoteSchema.parse(req.body);

    const payment = await PaymentTransaction.findOne({ reference, userId });
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Transaction introuvable.' });
    }

    if (payment.status === 'PAID') {
      return res.status(400).json({ success: false, message: 'Cette transaction a déjà été validée.' });
    }

    if (payment.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Cette transaction ne peut plus être déclarée. Contactez l’organisation.',
      });
    }

    const duplicate = await PaymentTransaction.findOne({
      _id: { $ne: payment._id },
      'metadata.declaredTransactionId': transactionId,
      status: { $in: ['PENDING', 'PAID'] },
    });
    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: 'Cet identifiant de transaction a déjà été soumis pour un autre paiement.',
      });
    }

    payment.metadata = {
      ...(payment.metadata || {}),
      payerPhone,
      declaredTransactionId: transactionId,
      declaredAt: new Date(),
    };
    await payment.save();

    return res.json({
      success: true,
      message: 'Paiement déclaré. Votre vote sera comptabilisé dès validation par l’administrateur.',
      payment: {
        reference: payment.reference,
        provider: payment.provider,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
      },
    });
  } catch (error: any) {
    if (error.errors) {
      return res.status(400).json({ success: false, message: error.errors[0].message });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};
