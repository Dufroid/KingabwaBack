import { Request, Response } from 'express';
import { Category } from '../models/Category.js';
import { Nominee } from '../models/Nominee.js';
import { createCategorySchema } from '../validators/index.js';

export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await Category.find().sort({ order: 1 });
    
    // Enrich categories with nominee counts
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const nomineeCount = await Nominee.countDocuments({ categoryId: cat._id, status: 'ACTIVE' });
        return {
          ...cat.toObject(),
          nomineeCount,
        };
      })
    );

    return res.json({ success: true, data: categoriesWithCount });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getCategoryBySlug = async (req: Request, res: Response) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Catégorie introuvable.' });
    }
    const nominees = await Nominee.find({ categoryId: category._id, status: 'ACTIVE' });
    return res.json({ success: true, category, nominees });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const validated = createCategorySchema.parse(req.body);
    const slug = validated.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-');

    const newCategory = await Category.create({
      ...validated,
      slug,
    });

    return res.status(201).json({ success: true, data: newCategory });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const updated = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Catégorie introuvable.' });
    return res.json({ success: true, data: updated });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const deleted = await Category.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Catégorie introuvable.' });
    return res.json({ success: true, message: 'Catégorie supprimée avec succès.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
