import { Request, Response } from 'express';
import { Winner } from '../models/Winner.js';

export const getWinners = async (req: Request, res: Response) => {
  try {
    const { year, category } = req.query;
    const filter: any = {};
    if (year) filter.editionYear = parseInt(year as string, 10);
    if (category) filter.categoryName = { $regex: category as string, $options: 'i' };

    const winners = await Winner.find(filter).sort({ editionYear: -1 });
    return res.json({ success: true, data: winners });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createWinner = async (req: Request, res: Response) => {
  try {
    const winner = await Winner.create(req.body);
    return res.status(201).json({ success: true, data: winner });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
