// ============================================
// Socket Pool Handlers
// ============================================

import { Socket } from 'socket.io';
import { PoolTable } from '../../models/PoolTable.js';
import { PoolSession } from '../../models/PoolSession.js';
import { PoolPlayer } from '../../models/PoolPlayer.js';
import { socketEvents, broadcast, broadcastToRole } from '../../config/socket.js';

export function registerPoolHandlers(socket: Socket): void {
  // Request all pool tables status
  socket.on('pool:getAll', async () => {
    const tables = await PoolTable.find().populate('currentSessionId').sort({ number: 1 });
    socket.emit('pool:list', { tables });
  });

  // Request available pool tables
  socket.on('pool:getAvailable', async () => {
    const tables = await PoolTable.findAvailable();
    socket.emit('pool:availableList', { tables });
  });

  // Subscribe to pool table updates
  socket.on('pool:subscribe', (tableId: string) => {
    socket.join(`pool:${tableId}`);
    console.log(`🎱 Socket ${socket.id} subscribed to pool table ${tableId}`);
  });

  // Unsubscribe from pool table
  socket.on('pool:unsubscribe', (tableId: string) => {
    socket.leave(`pool:${tableId}`);
  });

  // Request current session for a table
  socket.on('pool:getSession', async (tableId: string) => {
    const session = await PoolSession.findActiveByTable(tableId);
    socket.emit('pool:session', { tableId, session });
  });

  // Request leaderboard
  socket.on('pool:getLeaderboard', async (limit = 10) => {
    const leaderboard = await PoolPlayer.getLeaderboard(limit);
    socket.emit('pool:leaderboard', { leaderboard });
  });
}

// Utility function to emit pool events
export function emitPoolSessionStarted(table: any, session: any): void {
  broadcast(socketEvents.POOL_SESSION_STARTED, {
    tableId: table._id,
    number: table.number,
    session,
  });

  broadcastToRole('pool_manager', socketEvents.POOL_SESSION_STARTED, {
    tableId: table._id,
    number: table.number,
    session,
    alert: true,
    message: `Pool table ${table.number} session started`,
  });
}

export function emitPoolSessionUpdated(tableId: string, session: any): void {
  broadcast(socketEvents.POOL_SESSION_UPDATED, {
    tableId,
    session,
  });
}

export function emitPoolSessionEnded(table: any, session: any): void {
  broadcast(socketEvents.POOL_SESSION_ENDED, {
    tableId: table._id,
    number: table.number,
    session,
    totalCost: session.totalCost,
  });
}

export default { 
  registerPoolHandlers, 
  emitPoolSessionStarted, 
  emitPoolSessionUpdated, 
  emitPoolSessionEnded 
};
