import { Router } from 'express';
import {
  getDashboardMetrics,
  getUsers,
  updateUserRole,
  getEditions,
  createEdition,
  updateEdition,
  getTransactions,
  validateTransaction,
  rejectTransaction,
  uploadEditionImage,
  handleEditionImageUpload,
} from '../controllers/adminController.js';
import { generateTransactionsPdf } from '../controllers/reportController.js';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.js';

const router = Router();
router.get('/editions', getEditions);

// Protège toutes les routes admin (auth + rôle)
router.use(authenticateToken, authorizeRoles('ADMIN', 'SUPER_ADMIN'));

router.get('/dashboard', getDashboardMetrics);
router.get('/users', getUsers);
router.get('/transactions', getTransactions);
router.post('/transactions/:id/validate', validateTransaction);
router.post('/transactions/:id/reject', rejectTransaction);
router.post('/editions/upload-image', uploadEditionImage, handleEditionImageUpload);
router.patch('/users/:id/role', updateUserRole);
router.post('/editions', createEdition);
router.patch('/editions/:id', updateEdition);

// ─── Rapport PDF ──────────────────────────────────────────────────────────
router.get('/reports/transactions-pdf', generateTransactionsPdf);

export default router;
