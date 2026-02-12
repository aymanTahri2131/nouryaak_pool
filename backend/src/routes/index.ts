// ============================================
// Validators Index
// ============================================

import { Router } from 'express';
import authRoutes from './auth.routes.js';
import ordersRoutes from './orders.routes.js';
import cafeTablesRoutes from './cafeTables.routes.js';
import poolTablesRoutes from './poolTables.routes.js';
import productsRoutes from './products.routes.js';
import syncRoutes from './sync.routes.js';
import usersRoutes from './users.routes.js';
import reportsRoutes from './reports.routes.js';
import playersRoutes from './players.routes.js';
import tournamentRoutes from './tournament.routes.js';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'aroPos API is running',
    timestamp: new Date().toISOString(),
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/orders', ordersRoutes);
router.use('/cafe-tables', cafeTablesRoutes);
router.use('/pool-tables', poolTablesRoutes);
router.use('/products', productsRoutes);
router.use('/sync', syncRoutes);
router.use('/users', usersRoutes);
router.use('/reports', reportsRoutes);
router.use('/players', playersRoutes);
router.use('/pool-tournaments', tournamentRoutes);

export default router;
