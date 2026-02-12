// ============================================
// Players Routes
// ============================================

import { Router } from 'express';
import * as playersController from '../controllers/players.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET routes
router.get('/search', playersController.searchPlayers);
router.get('/', playersController.getAllPlayers);

export default router;
