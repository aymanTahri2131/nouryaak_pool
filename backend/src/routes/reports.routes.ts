// ============================================
// Reports Routes
// ============================================

import { Router } from 'express';
import * as reportsController from '../controllers/reports.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { poolManagerOrAdmin, requireRole } from '../middleware/role.middleware.js';

const router = Router();

// Dashboard and Reports are typically for admins and managers, but waiters can see their own
router.use(authenticateToken);
router.use(requireRole('admin', 'pool_manager', 'waiter'));

router.get('/stats', reportsController.getStats);

export default router;
