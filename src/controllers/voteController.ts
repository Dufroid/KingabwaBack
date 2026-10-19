import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import { Vote } from '../models/Vote.js';
import { AwardEdition } from '../models/AwardEdition.js';
import { Nominee } from '../models/Nominee.js';
import { Category } from '../models/Category.js';
import { castVoteSchema } from '../validators/index.js';

export const castVote = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Non autorisé.' });
    }

    const { editionId, categoryId, nomineeId, voteType } = castVoteSchema.parse(req.body);

    if (voteType !== 'FREE') {
      return res.status(400).json({
        success: false,
        message: 'Les votes payants doivent être initiés via le paiement Mobile Money.',
      });
    }

    const edition = await AwardEdition.findById(editionId);
    if (!edition) {
      return res.status(404).json({ success: false, message: 'Édition introuvable.' });
    }

    if (edition.status !== 'OPEN') {
      return res.status(400).json({
        success: false,
        message: 'Les votes pour cette édition ne sont pas actuellement ouverts.',
      });
    }

    const category = await Category.findById(categoryId);
    if (!category || !category.votingEnabled) {
      return res.status(400).json({
        success: false,
        message: 'Les votes sont désactivés pour cette catégorie.',
      });
    }

    const nominee = await Nominee.findOne({ _id: nomineeId, categoryId, status: 'ACTIVE' });
    if (!nominee) {
      return res.status(404).json({ success: false, message: 'Candidat valide introuvable.' });
    }

    const existingFreeVote = await Vote.findOne({
      userId,
      categoryId,
      editionId,
      voteType: 'FREE',
      status: { $ne: 'CANCELLED' },
    });

    if (existingFreeVote) {
      return res.status(400).json({
        success: false,
        message: 'Vous avez déjà utilisé votre vote gratuit dans cette catégorie pour cette édition.',
      });
    }

    const vote = await Vote.create({
      userId,
      editionId,
      categoryId,
      nomineeId,
      voteType: 'FREE',
      points: 1,
      status: 'CONFIRMED',
      confirmedAt: new Date(),
    });

    await Nominee.findByIdAndUpdate(nomineeId, { $inc: { voteCount: 1 } });

    return res.status(201).json({
      success: true,
      message: `Votre vote gratuit en faveur de ${nominee.fullName} a été enregistré.`,
      vote,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Un vote identique a déjà été enregistré pour cette combinaison.',
      });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyVotes = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const votes = await Vote.find({ userId })
      .populate('editionId', 'name year status')
      .populate('categoryId', 'name slug icon')
      .populate('nomineeId', 'fullName profileImage slug')
      .sort({ createdAt: -1 });

    return res.json({ success: true, count: votes.length, data: votes });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getVoteStatistics = async (req: AuthRequest, res: Response) => {
  try {
    const confirmedVotes = await Vote.aggregate([
      { $match: { status: 'CONFIRMED', voteType: { $in: ['FREE', 'PAID'] } } },
      {
        $group: {
          _id: '$nomineeId',
          voteCount: { $sum: { $ifNull: ['$points', 1] } },
        },
      },
      {
        $lookup: {
          from: 'nominees',
          localField: '_id',
          foreignField: '_id',
          as: 'nominee',
        },
      },
      { $unwind: '$nominee' },
      { $match: { 'nominee.status': 'ACTIVE' } },
      {
        $lookup: {
          from: 'categories',
          localField: 'nominee.categoryId',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      { $sort: { voteCount: -1 } },
      {
        $project: {
          _id: '$nominee._id',
          fullName: '$nominee.fullName',
          profileImage: '$nominee.profileImage',
          slug: '$nominee.slug',
          voteCount: 1,
          categoryId: { _id: '$category._id', name: '$category.name' },
        },
      },
    ]);

    const totalVotes = confirmedVotes.reduce((sum, row) => sum + row.voteCount, 0);

    const categoryStats = await Vote.aggregate([
      { $match: { status: 'CONFIRMED', voteType: { $in: ['FREE', 'PAID'] } } },
      {
        $group: {
          _id: '$categoryId',
          count: { $sum: 1 },
          totalPoints: { $sum: { $ifNull: ['$points', 1] } },
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
          categoryId: '$_id',
          categoryName: '$category.name',
          count: 1,
          totalPoints: 1,
        },
      },
    ]);

    return res.json({
      success: true,
      totalVotes,
      categoryStats,
      topNominees: confirmedVotes.slice(0, 5),
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
