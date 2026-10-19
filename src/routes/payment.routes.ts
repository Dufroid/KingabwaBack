import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.js';
import {
  getPaidVoteContext,
  getPaymentMethods,
  initiatePaidVotePayment,
} from '../controllers/paymentController.js';

const router = Router();

router.get('/methods', authenticateToken, getPaymentMethods);
router.get('/paid-vote-context', authenticateToken, getPaidVoteContext);
router.post('/mobile-money/initiate', authenticateToken, initiatePaidVotePayment);

export default router;
