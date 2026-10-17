import { Request, Response } from 'express';
import { AuthRequest } from '../types/index.js';
import { Vote } from '../models/Vote.js';
import { PaymentTransaction } from '../models/PaymentTransaction.js';
import { Nominee } from '../models/Nominee.js';
import { AwardEdition } from '../models/AwardEdition.js';
import { Category } from '../models/Category.js';
import { confirmMobileMoneyPayment, initiateMobileMoneyPayment } from '../config/mobileMoney.js';

export const initiatePaidVotePayment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Non autorisé.' });
    }

    const { editionId, categoryId, nomineeId, phone, provider } = req.body;
    let increments = Number(req.body.increments ?? req.body.amountIncrements ?? 0);
    if (!Number.isInteger(increments) || increments <= 0) increments = 10; // default to 10 if not provided

    const selectedProvider = provider || process.env.MOBILE_MONEY_PROVIDER || 'MOCK';
    if (!editionId || !categoryId || !nomineeId || !phone) {
      return res.status(400).json({ success: false, message: 'Données de paiement incomplètes.' });
    }

    if (increments < 1 || increments > 10) {
      return res.status(400).json({ success: false, message: 'Les incréments doivent être entre 1 et 10.' });
    }

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

    // Free vote should NOT block paid votes. Remove any blocking logic here.

    // Check if user already made a PAID transaction for this nominee/category/edition
    const previousPaid = await PaymentTransaction.findOne({
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
    const payment = await initiateMobileMoneyPayment({
      provider: selectedProvider,
      amount,
      phone,
      reference,
    });

    // create a PAID vote record (status PENDING if payment not yet confirmed)
    const vote = await Vote.create({
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

    await PaymentTransaction.create({
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
      await Nominee.findByIdAndUpdate(nomineeId, { $inc: { voteCount: increments } });
    }

    return res.json({
      success: true,
      message: payment.status === 'PAID'
        ? `Paiement validé. ${nominee.fullName} reçoit ${increments} point(s).`
        : `Le paiement mobile money a bien été initié pour ${amount} FC. Confirmez votre transaction pour valider le vote.`,
      payment,
      vote,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const confirmPaidVoteWebhook = async (req: Request, res: Response) => {
  try {
    const { reference, status, otpCode, code } = req.body || {};
    const submittedCode = (otpCode ?? code ?? '').toString().trim();

    if (!reference) {
      return res.status(400).json({ success: false, message: 'Référence de paiement requise.' });
    }

    const payment = await PaymentTransaction.findOne({ reference });
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
      const confirmation = await confirmMobileMoneyPayment(reference, submittedCode || undefined);
      const vote = await Vote.findById(payment.voteId);
      if (vote && vote.status !== 'CONFIRMED') {
        vote.status = 'CONFIRMED';
        vote.confirmedAt = new Date();
        await vote.save();
        // increment nominee by the vote points
        await Nominee.findByIdAndUpdate(vote.nomineeId, { $inc: { voteCount: vote.points } });
      }

      // Mark payment PAID
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
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
