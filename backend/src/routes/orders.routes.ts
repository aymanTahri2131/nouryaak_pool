// ============================================
// Orders Routes
// ============================================

import { Router } from 'express';
import * as ordersController from '../controllers/orders.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { waiterOrAdmin, requireRole } from '../middleware/role.middleware.js';
import { validateBody, validateParams } from '../middleware/validate.middleware.js';
import * as validators from '../validators/order.validator.js';

const router = Router();

// All routes require authentication
router.use(authenticateToken);
// GET routes - shared by waiter, bartender, admin
router.get('/', requireRole('waiter', 'bartender', 'admin'), ordersController.getOrders);
router.get('/active', requireRole('waiter', 'bartender', 'admin'), ordersController.getActiveOrders);
router.get('/today', requireRole('waiter', 'bartender', 'admin'), ordersController.getTodayOrders);
router.get('/stats', requireRole('waiter', 'admin'), ordersController.getOrderStats);
router.get('/history', requireRole('waiter', 'admin'), ordersController.getOrdersHistory);
router.get('/:id', requireRole('waiter', 'bartender', 'admin'), validateParams(validators.orderIdParamSchema), ordersController.getOrderById);

// POST routes - create order (waiter, admin)
router.post(
  '/',
  requireRole('waiter', 'admin'),
  validateBody(validators.createOrderSchema),
  ordersController.createOrder
);

// POST routes - add items
router.post(
  '/:id/items',
  requireRole('waiter', 'admin'),
  validateParams(validators.orderIdParamSchema),
  validateBody(validators.addItemsSchema),
  ordersController.addItems
);

// PATCH routes - update status (bartender can update to preparing/ready)
router.patch(
  '/:id/status',
  requireRole('waiter', 'bartender', 'admin'),
  validateParams(validators.orderIdParamSchema),
  validateBody(validators.updateStatusSchema),
  ordersController.updateStatus
);

// DELETE routes - cancel order
router.delete(
  '/:id',
  requireRole('waiter', 'admin'),
  validateParams(validators.orderIdParamSchema),
  ordersController.deleteOrder
);

// POST routes - archive order
router.post(
  '/:id/archive',
  requireRole('waiter', 'admin'),
  validateParams(validators.orderIdParamSchema),
  ordersController.archiveOrder
);

export default router;
