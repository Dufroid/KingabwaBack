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

    const { editionId, categoryId, nomineeId } = castVoteSchema.parse(req.body);

    // 1. Verify Edition status
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

    // 2. Check if Category has voting enabled
    const category = await Category.findById(categoryId);
    if (!category || !category.votingEnabled) {
      return res.status(400).json({
        success: false,
        message: 'Les votes sont désactivés pour cette catégorie.',
      });
    }

    // 3. Verify Nominee exists and is active
    const nominee = await Nominee.findOne({ _id: nomineeId, categoryId, status: 'ACTIVE' });
    if (!nominee) {
      return res.status(404).json({ success: false, message: 'Candidat valide introuvable.' });
    }

    // 4. Check for existing vote by this user in this category and edition
    const existingVote = await Vote.findOne({ userId, categoryId, editionId });
    if (existingVote) {
      return res.status(400).json({
        success: false,
        message: 'Vous avez déjà voté dans cette catégorie pour cette édition !',
      });
    }

    // 5. Register Vote and increment vote count on Nominee
    const vote = await Vote.create({
      userId,
      editionId,
      categoryId,
      nomineeId,
    });

    await Nominee.findByIdAndUpdate(nomineeId, { $inc: { voteCount: 1 } });

    return res.status(201).json({
      success: true,
      message: `Votre vote en faveur de ${nominee.fullName} dans la catégorie "${category.name}" a été enregistré avec succès !`,
      vote,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Vous avez déjà enregistré un vote dans cette catégorie.',
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
    const totalVotes = await Vote.countDocuments();
    
    // Aggregation of votes by category
    const categoryStats = await Vote.aggregate([
      {
        $group: {
          _id: '$categoryId',
          count: { $sum: 1 },
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
        },
      },
    ]);

    // Top voted nominees
    const topNominees = await Nominee.find({ status: 'ACTIVE' })
      .sort({ voteCount: -1 })
      .limit(5)
      .populate('categoryId', 'name');

    return res.json({
      success: true,
      totalVotes,
      categoryStats,
      topNominees,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
