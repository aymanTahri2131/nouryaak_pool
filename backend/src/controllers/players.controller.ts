// ============================================
// Players Controller
// ============================================

import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware.js';
import { PoolPlayer } from '../models/PoolPlayer.js';

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
    const players = await PoolPlayer.find()
        .sort({ name: 1 })
        .limit(limit);

    res.json({
        success: true,
        data: { players },
    });
});

export default {
    searchPlayers,
    getAllPlayers,
};
