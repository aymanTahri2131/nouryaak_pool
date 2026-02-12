// ============================================
// Socket Table Handlers
// ============================================

import { Socket } from 'socket.io';
import { CafeTable } from '../../models/CafeTable.js';
import { socketEvents, broadcast } from '../../config/socket.js';

export function registerTableHandlers(socket: Socket): void {
  // Request all tables status
  socket.on('table:getAll', async () => {
    const tables = await CafeTable.find().sort({ number: 1 });
    socket.emit('table:list', { tables });
  });

  // Request free tables
  socket.on('table:getFree', async () => {
    const tables = await CafeTable.findFree();
    socket.emit('table:freeList', { tables });
  });

  // Subscribe to table updates
  socket.on('table:subscribe', (tableId: string) => {
    socket.join(`table:${tableId}`);
    console.log(`🪑 Socket ${socket.id} subscribed to table ${tableId}`);
  });

  // Unsubscribe from table
  socket.on('table:unsubscribe', (tableId: string) => {
    socket.leave(`table:${tableId}`);
  });

  // Request table stats
  socket.on('table:getStats', async () => {
    const tables = await CafeTable.find();
    const stats = {
      total: tables.length,
      free: tables.filter(t => t.status === 'free').length,
      occupied: tables.filter(t => t.status !== 'free').length,
    };
    socket.emit('table:stats', { stats });
  });
}

// Utility function to emit table events
export function emitTableStatusChanged(table: any): void {
  broadcast(socketEvents.TABLE_STATUS_CHANGED, {
    tableId: table._id,
    number: table.number,
    status: table.status,
    waiterId: table.waiterId,
    waiterName: table.waiterName,
  });
}

export function emitTableAssigned(table: any): void {
  broadcast(socketEvents.TABLE_ASSIGNED, {
    tableId: table._id,
    number: table.number,
    waiterId: table.waiterId,
    waiterName: table.waiterName,
  });
}

export default { registerTableHandlers, emitTableStatusChanged, emitTableAssigned };
