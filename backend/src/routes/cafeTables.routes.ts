// ============================================
// Cafe Tables Routes
// ============================================

import { Router } from 'express';
import * as cafeTablesController from '../controllers/cafeTables.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { adminOnly } from '../middleware/index.js'; // Keep adminOnly for specific routes
import { waiterOrAdmin } from '../middleware/role.middleware.js';
import { validateBody, validateParams } from '../middleware/validate.middleware.js';
import { z } from 'zod';

const router = Router();

// Validation schemas
const tableIdSchema = z.object({
  id: z.string().min(1),
});

const createTableSchema = z.object({
  number: z.number().int().min(1),
  name: z.string().min(1),
  capacity: z.number().int().min(1).optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['free', 'ordered', 'preparing', 'ready', 'served', 'paid']),
});

const assignWaiterSchema = z.object({
  waiterId: z.string().min(1),
  waiterName: z.string().min(1),
});

// All routes require authentication
router.use(authenticateToken);

// GET routes
router.get('/', cafeTablesController.getAllTables);
router.get('/free', cafeTablesController.getFreeTables);
router.get('/stats', cafeTablesController.getTableStats);
router.get('/:id', validateParams(tableIdSchema), cafeTablesController.getTableById);

// POST routes
router.post('/', adminOnly, validateBody(createTableSchema), cafeTablesController.createTable);
router.post('/:id/free', validateParams(tableIdSchema), cafeTablesController.freeTable);
router.post('/:id/pay-all', validateParams(tableIdSchema), cafeTablesController.payAll);

// PATCH routes
router.patch(
  '/:id/status',
  validateParams(tableIdSchema),
  validateBody(updateStatusSchema),
  cafeTablesController.updateStatus
);

router.patch(
  '/:id/assign',
  validateParams(tableIdSchema),
  validateBody(assignWaiterSchema),
  cafeTablesController.assignWaiter
);

router.patch(
  '/:id',
  adminOnly,
  validateParams(tableIdSchema),
  cafeTablesController.updateTable
);

// DELETE routes
router.delete('/:id', adminOnly, validateParams(tableIdSchema), cafeTablesController.deleteTable);

export default router;
