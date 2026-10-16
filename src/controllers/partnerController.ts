import { Request, Response } from 'express';
import { Partner } from '../models/Partner.js';

export const getPartners = async (req: Request, res: Response) => {
  try {
    const includeInactive = req.query.all === 'true' || req.query.all === '1';
    const filter = includeInactive ? {} : { active: true };
    const partners = await Partner.find(filter).sort({ order: 1 });
    return res.json({ success: true, data: partners });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createPartner = async (req: Request, res: Response) => {
  try {
    const newPartner = await Partner.create(req.body);
    return res.status(201).json({ success: true, data: newPartner });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const updatePartner = async (req: Request, res: Response) => {
  try {
    const updated = await Partner.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Partenaire introuvable.' });
    return res.json({ success: true, data: updated });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const deletePartner = async (req: Request, res: Response) => {
  try {
    const deleted = await Partner.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Partenaire introuvable.' });
    return res.json({ success: true, message: 'Partenaire supprimé.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
