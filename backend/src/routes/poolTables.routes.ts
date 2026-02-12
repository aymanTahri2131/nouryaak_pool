// ============================================
// Pool Tables Routes
// ============================================

import { Router } from 'express';
import * as poolTablesController from '../controllers/poolTables.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { poolManagerOrAdmin, adminOnly } from '../middleware/role.middleware.js';
import { validateBody, validateParams } from '../middleware/validate.middleware.js';
import * as validators from '../validators/pool.validator.js';
import { z } from 'zod';

const router = Router();

// Validation schemas (inline for simplicity or if not in validator file)
const createTableSchema = z.object({
  number: z.number().int().min(1),
  name: z.string().min(1),
  pricePerPiece: z.number().min(0),
});

// All routes require authentication
router.use(authenticateToken);

// GET routes
router.get('/', poolTablesController.getAllTables);
router.get('/available', poolTablesController.getAvailableTables);
router.get('/leaderboard', poolTablesController.getLeaderboard);
router.get('/sessions/unpaid', poolManagerOrAdmin, poolTablesController.getUnpaidSessions);
router.get('/history/challenges', poolManagerOrAdmin, poolTablesController.getChallengeHistory);
router.get('/history/tournaments', poolManagerOrAdmin, poolTablesController.getTournamentHistory);
router.get('/history/pieces', poolManagerOrAdmin, poolTablesController.getPiecesHistory);
router.get('/:tableId', validateParams(validators.tableIdParamSchema), poolTablesController.getTableById);
router.get('/:tableId/session', validateParams(validators.tableIdParamSchema), poolTablesController.getSession);
router.get('/:tableId/history', validateParams(validators.tableIdParamSchema), poolTablesController.getSessionHistory);

// POST routes
router.post('/', poolManagerOrAdmin, validateBody(createTableSchema), poolTablesController.createTable);

// PATCH routes
router.patch('/:tableId', poolManagerOrAdmin, validateParams(validators.tableIdParamSchema), validateBody(createTableSchema.partial()), poolTablesController.updateTable);

// DELETE routes
router.delete('/:tableId', poolManagerOrAdmin, validateParams(validators.tableIdParamSchema), poolTablesController.deleteTable);

router.post(
  '/:tableId/session',
  poolManagerOrAdmin,
  validateParams(validators.tableIdParamSchema),
  validateBody(validators.startSessionSchema),
  poolTablesController.startSession
);

router.post(
  '/:tableId/session/pieces',
  poolManagerOrAdmin,
  validateParams(validators.tableIdParamSchema),
  validateBody(validators.addPiecesSchema),
  poolTablesController.addPieces
);

router.post(
  '/:tableId/session/pay',
  poolManagerOrAdmin,
  validateParams(validators.tableIdParamSchema),
  validateBody(validators.endSessionSchema.partial()),
  poolTablesController.endSession
);

// PATCH routes
router.patch(
  '/:tableId/session/challenge',
  poolManagerOrAdmin,
  validateParams(validators.tableIdParamSchema),
  validateBody(validators.updateChallengeSchema),
  poolTablesController.updateChallenge
);

router.patch(
  '/sessions/:sessionId/pay',
  poolManagerOrAdmin,
  poolTablesController.markAsPaid
);

export default router;
