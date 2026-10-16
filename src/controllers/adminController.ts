import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { User } from '../models/User.js';
import { Vote } from '../models/Vote.js';
import { Nominee } from '../models/Nominee.js';
import { Category } from '../models/Category.js';
import { BlogPost } from '../models/BlogPost.js';
import { NominationProposal } from '../models/NominationProposal.js';
import { AwardEdition } from '../models/AwardEdition.js';
import { PaymentTransaction } from '../models/PaymentTransaction.js';

const editionUploadDir = path.join(process.cwd(), 'uploads', 'editions');
fs.mkdirSync(editionUploadDir, { recursive: true });

const editionStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, editionUploadDir),
  filename: (_req, file, cb) => {
    const safeName = file.originalname
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9._-]/g, '');
    const extension = path.extname(safeName) || '.jpg';
    const baseName = path.basename(safeName, extension).slice(0, 40) || 'edition';
    cb(null, `${Date.now()}-${baseName}${extension}`);
  },
});

export const uploadEditionImage = multer({
  storage: editionStorage,
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
    const file = (req as any).file;
    if (!file) {
      return res.status(400).json({ success: false, message: 'Aucune image fournie.' });
    }

    const baseUrl = (process.env.UPLOADS_BASE_URL || `http://localhost:${process.env.PORT || 5000}`).replace(/\/$/, '');
    const relativePath = `/uploads/editions/${file.filename}`;

    return res.status(200).json({
      success: true,
      data: {
        url: `${baseUrl}${relativePath}`,
        relativePath,
        fileName: file.filename,
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
              _id: (tx.userId as any)._id,
              fullName: `${(tx.userId as any).firstName || ''} ${(tx.userId as any).lastName || ''}`.trim(),
              phone: (tx.userId as any).phone,
              email: (tx.userId as any).email,
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
            }
          : null,
        metadata: tx.metadata || {},
      })),
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
