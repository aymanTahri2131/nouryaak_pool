// ============================================
// Pool Service
// ============================================

import { PoolTable, type IPoolTableDocument } from '../models/PoolTable.js';
import { PoolSession, type IPoolSessionDocument } from '../models/PoolSession.js';
import { PoolPlayer } from '../models/PoolPlayer.js';
import { ApiError } from '../middleware/error.middleware.js';
import { broadcast, socketEvents } from '../config/socket.js';
import tournamentService from './tournament.service.js';
import type { StartSessionInput, AddPiecesInput, UpdateChallengeInput } from '../validators/pool.validator.js';

// ========== Pool Tables ==========

// Get all pool tables (with current session populated)
export async function getAllPoolTables(): Promise<IPoolTableDocument[]> {
  return PoolTable.find()
    .populate({
      path: 'currentSessionId',
      model: 'PoolSession',
    })
    .sort({ number: 1 });
}

// Get pool table by ID
export async function getPoolTableById(tableId: string): Promise<IPoolTableDocument | null> {
  return PoolTable.findById(tableId).populate('currentSessionId');
}

// Get available pool tables
export async function getAvailablePoolTables(): Promise<IPoolTableDocument[]> {
  return PoolTable.findAvailable();
}

// Create pool table
export async function createPoolTable(data: {
  number: number;
  name: string;
  pricePerPiece: number;
}): Promise<IPoolTableDocument> {
  const existing = await PoolTable.findByNumber(data.number);
  if (existing) {
    throw new ApiError(409, `Pool table ${data.number} already exists`);
  }

  return PoolTable.create({
    number: data.number,
    name: data.name,
    pricePerPiece: data.pricePerPiece,
    status: 'available',
  });
}

// Update pool table
export async function updatePoolTable(
  tableId: string,
  data: {
    number?: number;
    name?: string;
    pricePerPiece?: number;
  }
): Promise<IPoolTableDocument> {
  const table = await PoolTable.findById(tableId);
  if (!table) {
    throw new ApiError(404, 'Pool table not found');
  }

  if (data.number !== undefined && data.number !== table.number) {
    const existing = await PoolTable.findByNumber(data.number);
    if (existing) {
      throw new ApiError(409, `Pool table ${data.number} already exists`);
    }
    table.number = data.number;
  }

  if (data.name !== undefined) table.name = data.name;
  if (data.pricePerPiece !== undefined) table.pricePerPiece = data.pricePerPiece;

  await table.save();
  return table;
}

// Delete pool table
export async function deletePoolTable(tableId: string): Promise<void> {
  const table = await PoolTable.findById(tableId);
  if (!table) {
    throw new ApiError(404, 'Pool table not found');
  }

  if (table.status === 'occupied') {
    throw new ApiError(400, 'Cannot delete an occupied pool table');
  }

  await PoolTable.deleteOne({ _id: tableId });
}

// ========== Pool Sessions ==========

// Start a new session
export async function startSession(
  tableId: string,
  input: StartSessionInput
): Promise<IPoolSessionDocument> {
  const table = await PoolTable.findById(tableId);
  if (!table) {
    throw new ApiError(404, 'Pool table not found');
  }

  if (table.status === 'occupied') {
    throw new ApiError(400, 'Pool table is already occupied');
  }

  let session: IPoolSessionDocument;

  if (input.type === 'pieces') {
    // Create pieces session
    const totalCost = input.pieces * table.pricePerPiece;
    session = await PoolSession.create({
      tableId,
      type: 'pieces',
      pieces: [{
        count: input.pieces,
        playerName: input.playerName,
        addedAt: new Date(),
      }],
      totalCost,
      isPaid: false,
      startedAt: new Date(),
    });
  } else {
    // Create challenge session
    session = await PoolSession.create({
      tableId,
      type: 'challenge',
      challenge: {
        mode: input.mode,
        player1Name: input.player1Name,
        player2Name: input.player2Name,
        player1Score: 0,
        player2Score: 0,
        pricePerGame: input.pricePerGame || table.pricePerPiece,
      },
      totalCost: 0,
      isPaid: false,
      startedAt: new Date(),
    });
  }

  // Update table
  table.status = 'occupied';
  table.currentSessionId = session._id;
  await table.save();

  // Broadcast
  broadcast(socketEvents.POOL_SESSION_STARTED, {
    table: table.toJSON(),
    session: session.toJSON(),
  });

  return session;
}

// Add pieces to session
export async function addPieces(
  tableId: string,
  input: AddPiecesInput
): Promise<IPoolSessionDocument> {
  const table = await PoolTable.findById(tableId);
  if (!table) {
    throw new ApiError(404, 'Pool table not found');
  }

  const session = await PoolSession.findActiveByTable(tableId);
  if (!session) {
    throw new ApiError(404, 'No active session for this table');
  }

  if (session.type !== 'pieces') {
    throw new ApiError(400, 'Cannot add pieces to a challenge session');
  }

  // Add pieces
  if (!session.pieces) session.pieces = [];
  session.pieces.push({
    count: input.pieces,
    playerName: input.playerName,
    addedAt: new Date(),
  });

  // Recalculate total
  session.totalCost = session.calculateTotalCost(table.pricePerPiece);
  await session.save();

  // Broadcast
  broadcast(socketEvents.POOL_SESSION_UPDATED, {
    tableId,
    session: session.toJSON(),
  });

  return session;
}

// Update challenge score
export async function updateChallenge(
  tableId: string,
  input: UpdateChallengeInput
): Promise<IPoolSessionDocument> {
  const table = await PoolTable.findById(tableId);
  if (!table) {
    throw new ApiError(404, 'Pool table not found');
  }

  const session = await PoolSession.findActiveByTable(tableId);
  if (!session) {
    throw new ApiError(404, 'No active session for this table');
  }

  if (session.type !== 'challenge' || !session.challenge) {
    throw new ApiError(400, 'This is not a challenge session');
  }

  // Update scores
  if (input.player1Score !== undefined) {
    session.challenge.player1Score = input.player1Score;
  }
  if (input.player2Score !== undefined) {
    session.challenge.player2Score = input.player2Score;
  }
  if (input.winnerId !== undefined) {
    session.challenge.winnerId = input.winnerId;
    session.challenge.winnerName = input.winnerId === 1
      ? session.challenge.player1Name
      : session.challenge.player2Name;
  }

  // Calculate total (total games played)
  const totalGames = session.challenge.player1Score + session.challenge.player2Score;
  session.totalCost = totalGames * session.challenge.pricePerGame;

  await session.save();

  // Broadcast
  broadcast(socketEvents.POOL_SESSION_UPDATED, {
    tableId,
    session: session.toJSON(),
  });

  return session;
}

// End and pay session
export async function endSession(
  tableId: string,
  input?: {
    player1Score?: number;
    player2Score?: number;
    winnerId?: 1 | 2;
  }
): Promise<{
  session: IPoolSessionDocument;
  table: IPoolTableDocument;
}> {
  const table = await PoolTable.findById(tableId);
  if (!table) {
    throw new ApiError(404, 'Pool table not found');
  }

  // Try to find session by table's currentSessionId first, then fallback to active search
  let session = null;
  if (table.currentSessionId) {
    session = await PoolSession.findById(table.currentSessionId);
  }

  if (!session) {
    session = await PoolSession.findActiveByTable(tableId);
  }

  if (!session) {
    throw new ApiError(404, 'No active session for this table');
  }

  // Update results if provided (Challenge Mode only)
  if (input && session.type === 'challenge' && session.challenge) {
    if (input.player1Score !== undefined) session.challenge.player1Score = input.player1Score;
    if (input.player2Score !== undefined) session.challenge.player2Score = input.player2Score;
    if (input.winnerId !== undefined) {
      session.challenge.winnerId = input.winnerId;
      session.challenge.winnerName = input.winnerId === 1
        ? session.challenge.player1Name
        : session.challenge.player2Name;
    }

    // Recalculate cost based on total games
    const totalGames = session.challenge.player1Score + session.challenge.player2Score;
    session.totalCost = totalGames * session.challenge.pricePerGame;
  }

  // End session but DON'T mark as paid yet
  session.endedAt = new Date();
  await session.save();

  // If this was a tournament match, resolve it
  if (session.tournamentId && session.matchId && session.challenge?.winnerName) {
    await tournamentService.resolveMatch(
      session.tournamentId.toString(),
      session.matchId,
      session.challenge.winnerName,
      session.challenge.player1Score,
      session.challenge.player2Score
    );
  }

  // Free table
  table.status = 'available';
  table.currentSessionId = undefined;
  await table.save();

  // Broadcast
  broadcast(socketEvents.POOL_SESSION_ENDED, {
    tableId,
    session: session.toJSON(),
    table: table.toJSON(),
  });

  return { session, table };
}

// Mark session as paid
export async function markSessionAsPaid(sessionId: string): Promise<IPoolSessionDocument> {
  const session = await PoolSession.findById(sessionId);
  if (!session) {
    throw new ApiError(404, 'Session not found');
  }

  if (session.isPaid) {
    throw new ApiError(400, 'Session is already paid');
  }

  session.isPaid = true;
  await session.save();

  // Update player stats if challenge (only on payment)
  if (session.type === 'challenge' && session.challenge) {
    const { player1Name, player2Name, winnerId } = session.challenge;

    if (winnerId) {
      const winner = winnerId === 1 ? player1Name : player2Name;
      const loser = winnerId === 1 ? player2Name : player1Name;

      await PoolPlayer.updateStats(winner, true);
      await PoolPlayer.updateStats(loser, false);
    }
  }

  // Broadcast update
  broadcast(socketEvents.POOL_SESSION_UPDATED, {
    sessionId: session._id,
    session: session.toJSON(),
  });

  return session;
}

// Get session by table
export async function getSessionByTable(tableId: string): Promise<IPoolSessionDocument | null> {
  return PoolSession.findActiveByTable(tableId);
}

// Get session history for table
export async function getSessionHistory(tableId: string): Promise<IPoolSessionDocument[]> {
  return PoolSession.findByTable(tableId);
}

// ========== Leaderboard ==========

// Get leaderboard
export async function getLeaderboard(limit = 10): Promise<any[]> {
  return PoolPlayer.getLeaderboard(limit);
}

// Get player stats
export async function getPlayerStats(name: string): Promise<any | null> {
  return PoolPlayer.findByName(name);
}

// Get challenge history (paginated and filtered)
export async function getChallengeHistory(filters: {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  search?: string;
}) {
  const { page = 1, limit = 10, startDate, endDate, search } = filters;
  const query: any = { type: 'challenge', tournamentId: { $exists: false } };

  if (startDate || endDate) {
    query.startedAt = {};
    if (startDate) query.startedAt.$gte = new Date(startDate);
    if (endDate) query.startedAt.$lte = new Date(endDate);
  }

  if (search) {
    query.$or = [
      { 'challenge.player1Name': { $regex: search, $options: 'i' } },
      { 'challenge.player2Name': { $regex: search, $options: 'i' } },
    ];
  }

  const total = await PoolSession.countDocuments(query);
  const sessions = await PoolSession.find(query)
    .populate('tableId', 'number name')
    .sort({ startedAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return {
    sessions,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// Get pieces history (paginated and filtered)
export async function getPiecesHistory(filters: {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  search?: string;
}) {
  const { page = 1, limit = 10, startDate, endDate, search } = filters;
  const query: any = { type: 'pieces' };

  if (startDate || endDate) {
    query.startedAt = {};
    if (startDate) query.startedAt.$gte = new Date(startDate);
    if (endDate) query.startedAt.$lte = new Date(endDate);
  }

  if (search) {
    query['pieces.playerName'] = { $regex: search, $options: 'i' };
  }

  const total = await PoolSession.countDocuments(query);
  const sessions = await PoolSession.find(query)
    .populate('tableId', 'number name')
    .sort({ startedAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return {
    sessions,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// Get tournament history (paginated and filtered)
export async function getTournamentHistory(filters: {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  search?: string;
}) {
  const { page = 1, limit = 10, startDate, endDate, search } = filters;
  const query: any = { tournamentId: { $ne: null } };

  if (startDate || endDate) {
    query.startedAt = {};
    if (startDate) query.startedAt.$gte = new Date(startDate);
    if (endDate) query.startedAt.$lte = new Date(endDate);
  }

  if (search) {
    query.$or = [
      { 'challenge.player1Name': { $regex: search, $options: 'i' } },
      { 'challenge.player2Name': { $regex: search, $options: 'i' } },
    ];
  }

  const total = await PoolSession.countDocuments(query);
  const sessions = await PoolSession.find(query)
    .populate('tableId', 'number name')
    .sort({ startedAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return {
    sessions,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// Get all unpaid sessions
export async function getUnpaidSessions(): Promise<IPoolSessionDocument[]> {
  return PoolSession.find({
    isPaid: false,
    endedAt: { $ne: null },
  })
    .populate('tableId', 'number name')
    .sort({ endedAt: -1 });
}

export default {
  getAllPoolTables,
  getPoolTableById,
  getAvailablePoolTables,
  createPoolTable,
  updatePoolTable,
  deletePoolTable,
  startSession,
  addPieces,
  updateChallenge,
  endSession,
  getSessionByTable,
  getSessionHistory,
  getLeaderboard,
  getChallengeHistory,
  getPiecesHistory,
  getPlayerStats,
  markSessionAsPaid,
  getUnpaidSessions,
};
