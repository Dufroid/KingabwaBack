import { Request, Response } from 'express';
import { User } from '../models/User.js';
import { Vote } from '../models/Vote.js';
import { Nominee } from '../models/Nominee.js';
import { Category } from '../models/Category.js';
import { BlogPost } from '../models/BlogPost.js';
import { NominationProposal } from '../models/NominationProposal.js';
import { AwardEdition } from '../models/AwardEdition.js';

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

export const getEditions = async (req: Request, res: Response) => {
  try {
    const editions = await AwardEdition.find().sort({ year: -1 });
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
