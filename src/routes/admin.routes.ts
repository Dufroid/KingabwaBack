import { Router } from 'express';
import {
  getDashboardMetrics,
  getUsers,
  updateUserRole,
  getEditions,
  createEdition,
  updateEdition,
} from '../controllers/adminController.js';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.js';

const router = Router();

// Protect all admin routes with authentication and ADMIN / SUPER_ADMIN roles
router.use(authenticateToken, authorizeRoles('ADMIN', 'SUPER_ADMIN'));

router.get('/dashboard', getDashboardMetrics);
router.get('/users', getUsers);
router.patch('/users/:id/role', updateUserRole);

router.get('/editions', getEditions);
router.post('/editions', createEdition);
router.patch('/editions/:id', updateEdition);

export default router;
