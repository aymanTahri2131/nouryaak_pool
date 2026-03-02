// ============================================
// Tournament Controller
// ============================================

import { Request, Response } from 'express';
import { asyncHandler, ApiError } from '../middleware/error.middleware.js';
import tournamentService from '../services/tournament.service.js';

// GET /api/pool-tables/tournaments
export const getAllTournaments = asyncHandler(async (req: Request, res: Response) => {
    const tournaments = await tournamentService.getAllTournaments();
    res.json({
        success: true,
        data: { tournaments },
    });
});

// GET /api/pool-tables/tournaments/:id
export const getTournamentById = asyncHandler(async (req: Request, res: Response) => {
    const tournament = await tournamentService.getTournamentById(req.params.id as string);
    if (!tournament) throw new ApiError(404, 'Tournament not found');

    res.json({
        success: true,
        data: { tournament },
    });
});

// POST /api/pool-tables/tournaments
export const createTournament = asyncHandler(async (req: Request, res: Response) => {
    const { name, players, tableIds, status } = req.body;
    if (!name || !players || !tableIds) {
        throw new ApiError(400, 'Invalid tournament data');
    }

    const tournament = await tournamentService.createTournament({ name, players, tableIds, status });
    res.status(201).json({
        success: true,
        data: { tournament },
        message: 'Tournament created successfully',
    });
});

// PUT /api/pool-tables/tournaments/:id
export const updateTournament = asyncHandler(async (req: Request, res: Response) => {
    const { name, players, tableIds } = req.body;
    const tournament = await tournamentService.updateTournament(req.params.id as string, { name, players, tableIds });
    res.json({
        success: true,
        data: { tournament },
        message: 'Tournament updated successfully',
    });
});

// POST /api/pool-tables/tournaments/:id/finalize
export const finalizeTournament = asyncHandler(async (req: Request, res: Response) => {
    const tournament = await tournamentService.finalizeTournament(req.params.id as string);
    res.json({
        success: true,
        data: { tournament },
        message: 'Tournament finalized successfully',
    });
});

// POST /api/pool-tables/tournaments/:id/matches/:matchId/start
export const startMatch = asyncHandler(async (req: Request, res: Response) => {
    const { tableId, mode } = req.body;
    if (!tableId) throw new ApiError(400, 'Table ID is required');

    const tournament = await tournamentService.startMatch(req.params.id as string, req.params.matchId as string, tableId, mode);
    res.json({
        success: true,
        data: { tournament },
        message: 'Match started successfully',
    });
});

// PUT /api/pool-tables/tournaments/:id/matches/:matchId/players
export const updateMatchPlayers = asyncHandler(async (req: Request, res: Response) => {
    const { player1Name, player2Name } = req.body;

    // We expect at least one player name to be provided for update
    if (player1Name === undefined && player2Name === undefined) {
        throw new ApiError(400, 'At least one player name must be provided');
    }

    const tournament = await tournamentService.updateMatchPlayers(
        req.params.id as string,
        req.params.matchId as string,
        { player1Name, player2Name }
    );

    res.json({
        success: true,
        data: { tournament },
        message: 'Match players updated successfully',
    });
});

export default {
    getAllTournaments,
    getTournamentById,
    createTournament,
    updateTournament,
    finalizeTournament,
    startMatch,
    updateMatchPlayers,
};
