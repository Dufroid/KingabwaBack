import { Router } from 'express';
import { User } from '../models/User.js';
import { Nominee } from '../models/Nominee.js';
import { Category } from '../models/Category.js';

const router = Router();

router.get('/stats', async (_req, res) => {
  try {
    const [totalVoters, totalNominees, totalCategories] = await Promise.all([
      User.countDocuments({ role: 'VOTER' }),
      Nominee.countDocuments({ status: 'ACTIVE' }),
      Category.countDocuments(),
    ]);

    return res.json({
      success: true,
      data: {
        totalVoters,
        totalNominees,
        totalCategories,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Impossible de charger les statistiques publiques.',
    });
  }
});

export default router;
