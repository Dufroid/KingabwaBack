import { Request, Response } from 'express';
import multer from 'multer';
import { User } from '../models/User.js';
import { Vote } from '../models/Vote.js';
import { Nominee } from '../models/Nominee.js';
import { Category } from '../models/Category.js';
import { BlogPost } from '../models/BlogPost.js';
import { NominationProposal } from '../models/NominationProposal.js';
import { AwardEdition } from '../models/AwardEdition.js';
import { PaymentTransaction } from '../models/PaymentTransaction.js';
import { AuthRequest } from '../types/index.js';
import { buildLocalUploadResponse, isCloudinaryConfigured, uploadToCloudinary } from '../config/cloudinary.js';

export const uploadEditionImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Seules les images sont autorisées.'));
      return;
    }
    cb(null, true);
  },
}).single('image');

export const handleEditionImageUpload = async (req: Request, res: Response) => {
  try {
    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) {
      return res.status(400).json({ success: false, message: 'Aucune image fournie.' });
    }

    let uploadResult: { url: string; relativePath?: string; fileName?: string; publicId?: string };

    if (isCloudinaryConfigured) {
      uploadResult = await uploadToCloudinary(file, 'kingabwa/editions');
    } else {
      uploadResult = buildLocalUploadResponse(file, 'editions');
    }

    return res.status(200).json({
      success: true,
      data: {
        url: uploadResult.url,
        relativePath: uploadResult.relativePath || null,
        fileName: uploadResult.fileName || uploadResult.publicId || 'edition-image',
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
export const getDashboardMetrics = async (req: Request, res: Response) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalVoters = await User.countDocuments({ role: 'VOTER' });
    const totalVotes = await Vote.countDocuments();
    const totalNominees = await Nominee.countDocuments({ status: 'ACTIVE' });
    const totalCategories = await Category.countDocuments();
    const totalBlogPosts = await BlogPost.countDocuments({ status: 'PUBLISHED' });
    const totalProposals = await NominationProposal.countDocuments();

    // Votes count grouped by category for visual charts
    const votesByCategory = await Vote.aggregate([
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

    const activeEdition = await AwardEdition.findOne({ status: 'OPEN' });

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
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    return res.json({ success: true, count: users.length, data: users });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { role } = req.body;
    if (!['VISITOR', 'VOTER', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Rôle invalide.' });
    }

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!updated) return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });

    return res.json({ success: true, data: updated });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const  getEditions = async (req: Request, res: Response) => {
  
  try {
    const editions = await AwardEdition.find().sort({ year: -1 });
    console.log(editions,"eee")
    return res.json({ success: true, data: editions });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createEdition = async (req: Request, res: Response) => {
  try {
    const edition = await AwardEdition.create(req.body);
    return res.status(201).json({ success: true, data: edition });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const updateEdition = async (req: Request, res: Response) => {
  try {
    const updated = await AwardEdition.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Édition introuvable.' });
    return res.json({ success: true, data: updated });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getTransactions = async (req: Request, res: Response) => {
  try {
    const transactions = await PaymentTransaction.find()
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
              _id: (tx.userId as any)._id,
              fullName: `${(tx.userId as any).firstName || ''} ${(tx.userId as any).lastName || ''}`.trim(),
              phone: (tx.userId as any).phone,
              role: (tx.userId as any).role,
            }
          : null,
        vote: tx.voteId
          ? {
              _id: (tx.voteId as any)._id,
              voteType: (tx.voteId as any).voteType,
              points: (tx.voteId as any).points,
              status: (tx.voteId as any).status,
              nomineeId: (tx.voteId as any).nomineeId,
              nomineeName: (tx.voteId as any).nomineeId?.fullName || null,
              categoryName: (tx.voteId as any).categoryId?.name || null,
              editionName: (tx.voteId as any).editionId?.name || null,
              confirmedAt: (tx.voteId as any).confirmedAt,
            }
          : null,
        metadata: tx.metadata || {},
      })),
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const confirmVoteFromTransaction = async (payment: any) => {
  let vote = payment.voteId ? await Vote.findById(payment.voteId) : null;

  if (!vote) {
    vote = await Vote.findOne({
      userId: payment.userId,
      editionId: payment.metadata?.editionId,
      categoryId: payment.metadata?.categoryId,
      nomineeId: payment.metadata?.nomineeId,
      voteType: 'PAID',
      status: 'PENDING',
    }).sort({ createdAt: -1 });
  }

  if (!vote) return null;

  const confirmedVote = await Vote.findOneAndUpdate(
    { _id: vote._id, status: 'PENDING' },
    { $set: { status: 'CONFIRMED', confirmedAt: new Date() } },
    { new: true }
  );

  if (!confirmedVote) return null;

  const nominee = await Nominee.findByIdAndUpdate(
    confirmedVote.nomineeId,
    { $inc: { voteCount: confirmedVote.points } },
    { new: true }
  );

  return { vote: confirmedVote, nominee };
};

export const validateTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const payment = await PaymentTransaction.findOneAndUpdate(
      { _id: req.params.id, status: 'PENDING' },
      {
        $set: {
          status: 'PAID',
          'metadata.validatedBy': req.user?.userId || '',
          'metadata.validatedAt': new Date(),
        },
      },
      { new: true }
    );

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
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const rejectTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const reason = (req.body?.reason || '').toString().trim();

    const payment = await PaymentTransaction.findOneAndUpdate(
      { _id: req.params.id, status: 'PENDING' },
      {
        $set: {
          status: 'FAILED',
          'metadata.rejectedBy': req.user?.userId || '',
          'metadata.rejectedAt': new Date(),
          'metadata.rejectionReason': reason,
        },
      },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Transaction en attente introuvable ou déjà traitée.',
      });
    }

    if (payment.voteId) {
      await Vote.findOneAndUpdate(
        { _id: payment.voteId, status: 'PENDING' },
        { $set: { status: 'CANCELLED' } }
      );
    }

    return res.json({
      success: true,
      message: 'Paiement rejeté. Le vote associé a été annulé.',
      payment,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
