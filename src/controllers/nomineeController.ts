import { Request, Response } from 'express';
import multer from 'multer';
import { Nominee } from '../models/Nominee.js';
import { Vote } from '../models/Vote.js';
import { buildLocalUploadResponse, isCloudinaryConfigured, uploadToCloudinary } from '../config/cloudinary.js';
import { createNomineeSchema } from '../validators/index.js';

const getConfirmedVoteCounts = async (nomineeIds: any[]): Promise<Map<string, number>> => {
  if (nomineeIds.length === 0) return new Map();

  const rows = await Vote.aggregate([
    {
      $match: {
        nomineeId: { $in: nomineeIds },
        status: 'CONFIRMED',
        voteType: { $in: ['FREE', 'PAID'] },
      },
    },
    {
      $group: {
        _id: '$nomineeId',
        voteCount: { $sum: { $ifNull: ['$points', 1] } },
      },
    },
  ]);

  return new Map(rows.map((row) => [String(row._id), row.voteCount]));
};

export const uploadNomineeImage = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Seules les images sont autorisées.'));
      return;
    }
    cb(null, true);
  },
}).single('image');

export const handleNomineeImageUpload = async (req: Request, res: Response) => {
  try {
    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) {
      return res.status(400).json({ success: false, message: 'Aucune image fournie.' });
    }

    let uploadResult: { url: string; relativePath?: string; fileName?: string; publicId?: string };

    if (isCloudinaryConfigured) {
      uploadResult = await uploadToCloudinary(file, 'kingabwa/nominees');
    } else {
      uploadResult = buildLocalUploadResponse(file, 'nominees');
    }

    return res.status(200).json({
      success: true,
      data: {
        url: uploadResult.url,
        relativePath: uploadResult.relativePath || null,
        fileName: uploadResult.fileName || uploadResult.publicId || 'nominee-image',
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getNominees = async (req: Request, res: Response) => {
  try {
    const { categoryId, editionId, search } = req.query;
    const filter: any = { status: 'ACTIVE' };

    if (categoryId) filter.categoryId = categoryId;
    if (editionId) filter.editionId = editionId;
    if (search) {
      filter.fullName = { $regex: search as string, $options: 'i' };
    }

    const nominees = await Nominee.find(filter)
      .populate('categoryId', 'name slug icon')
      .populate('editionId', 'name year status');

    const voteCounts = await getConfirmedVoteCounts(nominees.map((nominee) => nominee._id));

    return res.json({
      success: true,
      count: nominees.length,
      data: nominees.map((nominee) => ({
        ...nominee.toObject(),
        voteCount: voteCounts.get(String(nominee._id)) ?? 0,
      })),
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getNomineeBySlug = async (req: Request, res: Response) => {
  try {
    const nominee = await Nominee.findOne({ slug: req.params.slug })
      .populate('categoryId', 'name slug description icon')
      .populate('editionId', 'name year votingStartDate votingEndDate status');

    if (!nominee) {
      return res.status(404).json({ success: false, message: 'Candidat introuvable.' });
    }

    const voteCounts = await getConfirmedVoteCounts([nominee._id]);

    return res.json({
      success: true,
      data: {
        ...nominee.toObject(),
        voteCount: voteCounts.get(String(nominee._id)) ?? 0,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createNominee = async (req: Request, res: Response) => {
  try {
    const validated = createNomineeSchema.parse(req.body);
    const slug = validated.fullName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-');

    const newNominee = await Nominee.create({
      ...validated,
      slug,
    });

    return res.status(201).json({ success: true, data: newNominee });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const updateNominee = async (req: Request, res: Response) => {
  try {
    const updated = await Nominee.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Candidat introuvable.' });
    return res.json({ success: true, data: updated });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteNominee = async (req: Request, res: Response) => {
  try {
    const deleted = await Nominee.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Candidat introuvable.' });
    return res.json({ success: true, message: 'Candidat supprimé avec succès.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
