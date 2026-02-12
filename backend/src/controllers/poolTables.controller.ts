// ============================================
// Pool Tables Controller
// ============================================

import { Request, Response } from 'express';
import { asyncHandler, ApiError } from '../middleware/error.middleware.js';
import * as poolService from '../services/pool.service.js';
import type { StartSessionInput, AddPiecesInput, UpdateChallengeInput, EndSessionInput } from '../validators/pool.validator.js';

// GET /api/pool-tables
export const getAllTables = asyncHandler(async (req: Request, res: Response) => {
  const tables = await poolService.getAllPoolTables();

  res.json({
    success: true,
    data: { tables },
  });
});

// GET /api/pool-tables/available
export const getAvailableTables = asyncHandler(async (req: Request, res: Response) => {
  const tables = await poolService.getAvailablePoolTables();

  res.json({
    success: true,
    data: { tables },
  });
});

// GET /api/pool-tables/leaderboard
export const getLeaderboard = asyncHandler(async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 10;
  const leaderboard = await poolService.getLeaderboard(limit);

  res.json({
    success: true,
    data: { leaderboard },
  });
});

// GET /api/pool-tables/:tableId
export const getTableById = asyncHandler(async (req: Request, res: Response) => {
  const table = await poolService.getPoolTableById(req.params.tableId as any);

  if (!table) {
    throw new ApiError(404, 'Pool table not found');
  }

  res.json({
    success: true,
    data: { table },
  });
});

// GET /api/pool-tables/:tableId/session
export const getSession = asyncHandler(async (req: Request, res: Response) => {
  const session = await poolService.getSessionByTable(req.params.tableId as any);

  res.json({
    success: true,
    data: { session },
  });
});

// GET /api/pool-tables/:tableId/history
export const getSessionHistory = asyncHandler(async (req: Request, res: Response) => {
  const sessions = await poolService.getSessionHistory(req.params.tableId as any);

  res.json({
    success: true,
    data: { sessions },
  });
});

// POST /api/pool-tables (admin only)
export const createTable = asyncHandler(async (req: Request, res: Response) => {
  const { number, name, pricePerPiece } = req.body;
  const table = await poolService.createPoolTable({ number, name, pricePerPiece });

  res.status(201).json({
    success: true,
    data: { table },
    message: 'Pool table created successfully',
  });
});

// POST /api/pool-tables/:tableId/session
export const startSession = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as StartSessionInput;
  const session = await poolService.startSession(req.params.tableId as any, input);

  res.status(201).json({
    success: true,
    data: { session },
    message: 'Session started successfully',
  });
});

// POST /api/pool-tables/:tableId/session/pieces
export const addPieces = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as AddPiecesInput;
  const session = await poolService.addPieces(req.params.tableId as any, input);

  res.json({
    success: true,
    data: { session },
    message: 'Pieces added successfully',
  });
});

// PATCH /api/pool-tables/:tableId/session/challenge
export const updateChallenge = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as UpdateChallengeInput;
  const session = await poolService.updateChallenge(req.params.tableId as any, input);

  res.json({
    success: true,
    data: { session },
    message: 'Challenge updated successfully',
  });
});

// POST /api/pool-tables/:tableId/session/pay
export const endSession = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as EndSessionInput;
  const { session, table } = await poolService.endSession(req.params.tableId as any, input);

  res.json({
    success: true,
    data: { session, table },
    message: 'Session ended successfully',
  });
});

// GET /api/pool-tables/sessions/unpaid
export const getUnpaidSessions = asyncHandler(async (req: Request, res: Response) => {
  const sessions = await poolService.getUnpaidSessions();

  res.json({
    success: true,
    data: { sessions },
  });
});

// PATCH /api/pool-tables/sessions/:sessionId/pay
export const markAsPaid = asyncHandler(async (req: Request, res: Response) => {
  const session = await poolService.markSessionAsPaid(req.params.sessionId as any);

  res.json({
    success: true,
    data: { session },
    message: 'Session marked as paid successfully',
  });
});

// PATCH /api/pool-tables/:tableId (admin only)
export const updateTable = asyncHandler(async (req: Request, res: Response) => {
  const { number, name, pricePerPiece } = req.body;
  const table = await poolService.updatePoolTable(req.params.tableId as any, { number, name, pricePerPiece });

  res.json({
    success: true,
    data: { table },
    message: 'Pool table updated successfully',
  });
});

// DELETE /api/pool-tables/:tableId (admin only)
export const deleteTable = asyncHandler(async (req: Request, res: Response) => {
  await poolService.deletePoolTable(req.params.tableId as any);

  res.json({
    success: true,
    message: 'Pool table deleted successfully',
  });
});

// GET /api/pool-tables/history/challenges
export const getChallengeHistory = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, startDate, endDate, search } = req.query;

  const history = await poolService.getChallengeHistory({
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    startDate: startDate as string,
    endDate: endDate as string,
    search: search as string,
  });

  res.json({
    success: true,
    data: history,
  });
});

// GET /api/pool-tables/history/pieces
export const getPiecesHistory = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, startDate, endDate, search } = req.query;

  const history = await poolService.getPiecesHistory({
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    startDate: startDate as string,
    endDate: endDate as string,
    search: search as string,
  });

  res.json({
    success: true,
    data: history,
  });
});

// GET /api/pool-tables/history/tournaments
export const getTournamentHistory = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, startDate, endDate, search } = req.query;

  const history = await poolService.getTournamentHistory({
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    startDate: startDate as string,
    endDate: endDate as string,
    search: search as string,
  });

  res.json({
    success: true,
    data: history,
  });
});

export default {
  getAllTables,
  getAvailableTables,
  getLeaderboard,
  getTableById,
  getSession,
  getSessionHistory,
  createTable,
  startSession,
  addPieces,
  updateChallenge,
  deleteTable,
  getChallengeHistory,
  getPiecesHistory,
  getTournamentHistory,
  getUnpaidSessions,
  markAsPaid,
};
