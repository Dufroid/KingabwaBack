import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.js';
import { confirmPaidVoteWebhook, initiatePaidVotePayment } from '../controllers/paymentController.js';

const router = Router();

router.post('/mobile-money/initiate', authenticateToken, initiatePaidVotePayment);
router.post('/mobile-money/webhook', confirmPaidVoteWebhook);

export default router;
