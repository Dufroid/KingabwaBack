import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.js';
import {
  declarePaidVotePayment,
  getPaidVoteContext,
  getPaymentMethods,
  initiatePaidVotePayment,
} from '../controllers/paymentController.js';

const router = Router();

router.get('/methods', authenticateToken, getPaymentMethods);
router.get('/paid-vote-context', authenticateToken, getPaidVoteContext);
router.post('/mobile-money/initiate', authenticateToken, initiatePaidVotePayment);
router.post('/mobile-money/declare', authenticateToken, declarePaidVotePayment);

export default router;
