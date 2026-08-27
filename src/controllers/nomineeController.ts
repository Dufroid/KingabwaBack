import { Request, Response } from 'express';
import { Nominee } from '../models/Nominee.js';
import { createNomineeSchema } from '../validators/index.js';

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

    return res.json({ success: true, count: nominees.length, data: nominees });
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

    return res.json({ success: true, data: nominee });
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
