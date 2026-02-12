// ============================================
// Tournament Routes
// ============================================

import { Router } from 'express';
import tournamentController from '../controllers/tournament.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { poolManagerOrAdmin } from '../middleware/role.middleware.js';

const router = Router();

router.use(authenticateToken);
router.use(poolManagerOrAdmin);

router.get('/', tournamentController.getAllTournaments);
router.get('/:id', tournamentController.getTournamentById);
router.post('/', tournamentController.createTournament);
router.put('/:id', tournamentController.updateTournament);
router.post('/:id/finalize', tournamentController.finalizeTournament);
router.post('/:id/matches/:matchId/start', tournamentController.startMatch);

export default router;
