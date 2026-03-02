// ============================================
// Players Routes
// ============================================

import { Router } from 'express';
import * as playersController from '../controllers/players.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { poolManagerOrAdmin } from '../middleware/role.middleware.js';
import { validateBody, validateParams } from '../middleware/validate.middleware.js';
import * as validators from '../validators/players.validator.js';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET routes
router.get('/search', playersController.searchPlayers);
router.get('/', playersController.getAllPlayers);

// POST /api/players - Create new player
router.post(
    '/',
    poolManagerOrAdmin,
    validateBody(validators.createPlayerSchema),
    playersController.createPlayer
);

// PUT /api/players/:id - Update player
router.put(
    '/:id',
    poolManagerOrAdmin,
    validateParams(validators.playerIdParamSchema),
    validateBody(validators.updatePlayerSchema),
    playersController.updatePlayer
);

// DELETE /api/players/:id - Delete player
router.delete(
    '/:id',
    poolManagerOrAdmin,
    validateParams(validators.playerIdParamSchema),
    playersController.deletePlayer
);

export default router;
