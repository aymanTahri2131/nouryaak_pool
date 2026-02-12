// ============================================
// Sync Routes
// ============================================

import { Router } from 'express';
import * as syncController from '../controllers/sync.controller.js';
import { authenticateToken, adminOnly } from '../middleware/index.js';

const router = Router();

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(adminOnly);

// Status and test
router.get('/status', syncController.getStatus);
router.get('/test', syncController.testConnection);
router.post('/cleanup-indexes', syncController.cleanupIndexes);

// Sync from Aronium
router.post('/all', syncController.syncAllData);
router.post('/categories', syncController.syncCategoriesOnly);
router.post('/products', syncController.syncProductsOnly);
router.post('/tables', syncController.syncTablesOnly);

// Export to Aronium
router.post('/export/order/:orderId', syncController.exportOrder);
router.post('/export/pool/:sessionId', syncController.exportPoolSession);
router.post('/export/pending', syncController.exportPending);

export default router;
