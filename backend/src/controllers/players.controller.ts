// ============================================
// Players Controller
// ============================================

import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware.js';
import { PoolPlayer } from '../models/PoolPlayer.js';

// GET /api/players/search?q=...
// GET /api/players/search?q=...
export const searchPlayers = asyncHandler(async (req: Request, res: Response) => {
    const query = (req.query.q as string) || '';

    if (!query || query.length < 2) {
        return res.json({
            success: true,
            data: { players: [] },
        });
    }

    const players = await PoolPlayer.find({
        name: new RegExp(query, 'i'),
    }).limit(10);

    res.json({
        success: true,
        data: { players },
    });
});

// GET /api/players
export const getAllPlayers = asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 50;
    const page = parseInt(req.query.page as string) || 1;
    const search = req.query.search as string;

    const query: any = {};
    if (search) {
        query.name = new RegExp(search, 'i');
    }

    const skip = (page - 1) * limit;

    const [players, total] = await Promise.all([
        PoolPlayer.find(query)
            .sort({ name: 1 })
            .skip(skip)
            .limit(limit),
        PoolPlayer.countDocuments(query),
    ]);

    res.json({
        success: true,
        data: {
            players,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        },
    });
});

// POST /api/players
export const createPlayer = asyncHandler(async (req: Request, res: Response) => {
    const input = req.body;

    const existingPlayer = await PoolPlayer.findOne({ name: new RegExp(`^${input.name.trim()}$`, 'i') });
    if (existingPlayer) {
        res.status(409);
        throw new Error('Player name already exists');
    }

    const player = await PoolPlayer.create({
        name: input.name.trim(),
        wins: input.wins || 0,
        losses: input.losses || 0,
        matchesPlayed: input.matchesPlayed || 0,
        avatarUrl: input.avatarUrl || undefined,
    });

    res.status(201).json({
        success: true,
        data: { player },
    });
});

// PUT /api/players/:id
export const updatePlayer = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body;

    const player = await PoolPlayer.findById(id);
    if (!player) {
        res.status(404);
        throw new Error('Player not found');
    }

    if (updates.name && updates.name.trim() !== player.name) {
        const existingPlayer = await PoolPlayer.findOne({ name: new RegExp(`^${updates.name.trim()}$`, 'i') });
        if (existingPlayer && existingPlayer._id.toString() !== id) {
            res.status(409);
            throw new Error('Player name already exists');
        }
        player.name = updates.name.trim();
    }

    if (updates.wins !== undefined) player.wins = updates.wins;
    if (updates.losses !== undefined) player.losses = updates.losses;
    if (updates.matchesPlayed !== undefined) player.matchesPlayed = updates.matchesPlayed;
    if (updates.avatarUrl !== undefined) player.avatarUrl = updates.avatarUrl || undefined;

    await player.save();

    res.json({
        success: true,
        data: { player },
    });
});

// DELETE /api/players/:id
export const deletePlayer = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const player = await PoolPlayer.findById(id);
    if (!player) {
        res.status(404);
        throw new Error('Player not found');
    }

    await player.deleteOne();

    res.json({
        success: true,
        message: 'Player deleted successfully',
    });
});

export default {
    searchPlayers,
    getAllPlayers,
    createPlayer,
    updatePlayer,
    deletePlayer,
};
