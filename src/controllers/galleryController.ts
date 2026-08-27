import { Request, Response } from 'express';
import { GalleryMedia } from '../models/GalleryMedia.js';

export const getGallery = async (req: Request, res: Response) => {
  try {
    const { category, type, editionYear } = req.query;
    const filter: any = {};
    if (category) filter.category = category;
    if (type) filter.type = type;
    if (editionYear) filter.editionYear = parseInt(editionYear as string, 10);

    const items = await GalleryMedia.find(filter).sort({ createdAt: -1 });
    return res.json({ success: true, count: items.length, data: items });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createGalleryMedia = async (req: Request, res: Response) => {
  try {
    const item = await GalleryMedia.create(req.body);
    return res.status(201).json({ success: true, data: item });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteGalleryMedia = async (req: Request, res: Response) => {
  try {
    const deleted = await GalleryMedia.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Média introuvable.' });
    return res.json({ success: true, message: 'Média supprimé.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
