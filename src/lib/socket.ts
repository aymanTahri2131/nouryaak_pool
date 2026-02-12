// ============================================
// Socket.io Client for aroPos
// ============================================

import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '/';

let socket: Socket | null = null;

export function connectSocket(): Socket {
  if (socket?.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('🔌 Socket connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Socket connection error:', error);
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket(): Socket | null {
  return socket;
}

// Join role room for targeted broadcasts
export function joinRole(role: string): void {
  socket?.emit('auth:role', role);
}

// ============================================
// Event Subscriptions
// ============================================

// Orders
export function subscribeToOrders(callback: (data: any) => void): () => void {
  if (!socket) return () => { };

  socket.on('order:created', callback);
  socket.on('order:updated', callback);
  socket.on('order:status_changed', callback);
  socket.on('order:paid', callback);
  socket.on('order:deleted', callback);

  return () => {
    socket?.off('order:created', callback);
    socket?.off('order:updated', callback);
    socket?.off('order:status_changed', callback);
    socket?.off('order:paid', callback);
    socket?.off('order:deleted', callback);
  };
}

export function subscribeToTable(tableId: string, callback: (data: any) => void): () => void {
  if (!socket) return () => { };

  socket.emit('order:subscribe', tableId);
  socket.on('order:current', callback);

  return () => {
    socket?.emit('order:unsubscribe', tableId);
    socket?.off('order:current', callback);
  };
}

// Tables
export function subscribeToTableStatus(callback: (data: any) => void): () => void {
  if (!socket) return () => { };

  socket.on('table:statusChanged', callback);
  socket.on('table:assigned', callback);

  return () => {
    socket?.off('table:statusChanged', callback);
    socket?.off('table:assigned', callback);
  };
}

// Pool
export function subscribeToPool(callback: (data: any) => void): () => void {
  if (!socket) return () => { };

  socket.on('pool:sessionStarted', callback);
  socket.on('pool:sessionUpdated', callback);
  socket.on('pool:sessionEnded', callback);

  return () => {
    socket?.off('pool:sessionStarted', callback);
    socket?.off('pool:sessionUpdated', callback);
    socket?.off('pool:sessionEnded', callback);
  };
}

// Sync
export function subscribeToSync(callback: (data: any) => void): () => void {
  if (!socket) return () => { };

  socket.on('sync:started', callback);
  socket.on('sync:progress', callback);
  socket.on('sync:completed', callback);
  socket.on('sync:failed', callback);

  return () => {
    socket?.off('sync:started', callback);
    socket?.off('sync:progress', callback);
    socket?.off('sync:completed', callback);
    socket?.off('sync:failed', callback);
  };
}

// Request data via socket
export function requestActiveOrders(): void {
  socket?.emit('order:getActive');
}

export function requestAllTables(): void {
  socket?.emit('table:getAll');
}

export function requestPoolTables(): void {
  socket?.emit('pool:getAll');
}

export function requestLeaderboard(limit = 10): void {
  socket?.emit('pool:getLeaderboard', limit);
}

export default {
  connect: connectSocket,
  disconnect: disconnectSocket,
  getSocket,
  joinRole,
  subscribeToOrders,
  subscribeToTable,
  subscribeToTableStatus,
  subscribeToPool,
  subscribeToSync,
  requestActiveOrders,
  requestAllTables,
  requestPoolTables,
  requestLeaderboard,
};
