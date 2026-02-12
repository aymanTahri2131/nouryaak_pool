// ============================================
// Pool Validators (Zod schemas)
// ============================================

import { z } from 'zod';

// Start pieces session
export const startPiecesSessionSchema = z.object({
  pieces: z.number().int().min(1, 'Must have at least 1 piece'),
  playerName: z.string().optional(),
});

// Start challenge session
export const startChallengeSessionSchema = z.object({
  mode: z.union([z.literal(3), z.literal(5), z.literal(7)]),
  player1Name: z.string().min(1, 'Player 1 name required'),
  player2Name: z.string().min(1, 'Player 2 name required'),
  pricePerGame: z.number().min(0).optional(),
});

// Start session (union of both types)
export const startSessionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('pieces'),
    pieces: z.number().int().min(1),
    playerName: z.string().optional(),
  }),
  z.object({
    type: z.literal('challenge'),
    mode: z.union([z.literal(3), z.literal(5), z.literal(7)]),
    player1Name: z.string().min(1),
    player2Name: z.string().min(1),
    pricePerGame: z.number().min(0).optional(),
  }),
]);

// Add pieces to session
export const addPiecesSchema = z.object({
  pieces: z.number().int().min(1, 'Must add at least 1 piece'),
  playerName: z.string().optional(),
});

// Update challenge score
export const updateChallengeSchema = z.object({
  player1Score: z.number().int().min(0).optional(),
  player2Score: z.number().int().min(0).optional(),
  winnerId: z.union([z.literal(1), z.literal(2)]).optional(),
});

// End session with results
export const endSessionSchema = z.object({
  player1Score: z.number().int().min(0).optional(),
  player2Score: z.number().int().min(0).optional(),
  winnerId: z.union([z.literal(1), z.literal(2)]).optional(),
});

// Table ID param
export const tableIdParamSchema = z.object({
  tableId: z.string().min(1, 'Table ID required'),
});

export type StartSessionInput = z.infer<typeof startSessionSchema>;
export type AddPiecesInput = z.infer<typeof addPiecesSchema>;
export type UpdateChallengeInput = z.infer<typeof updateChallengeSchema>;
export type EndSessionInput = z.infer<typeof endSessionSchema>;
