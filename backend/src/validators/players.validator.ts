import { z } from 'zod';

export const createPlayerSchema = z.object({
    name: z.string().min(1, 'Player name is required'),
    wins: z.number().int().min(0).default(0),
    losses: z.number().int().min(0).default(0),
    matchesPlayed: z.number().int().min(0).default(0),
    avatarUrl: z.string().url('Must be a valid URL').optional().default('https://res.cloudinary.com/doq0mdnkz/image/upload/v1772425099/gsekayy2xtsfratohk3q.png'),
});

export const updatePlayerSchema = z.object({
    name: z.string().min(1, 'Player name is required').optional(),
    wins: z.number().int().min(0).optional(),
    losses: z.number().int().min(0).optional(),
    matchesPlayed: z.number().int().min(0).optional(),
    avatarUrl: z.string().url('Must be a valid URL').optional(),
});

export const playerIdParamSchema = z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid player ID format'),
});

export type CreatePlayerInput = z.infer<typeof createPlayerSchema>;
export type UpdatePlayerInput = z.infer<typeof updatePlayerSchema>;
