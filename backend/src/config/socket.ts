// ============================================
// Socket.io Configuration
// ============================================

import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { env } from './env.js';

let io: Server | null = null;

export function initializeSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: [
        'http://localhost:8080',
        'http://localhost:5173',
        env.CORS_ORIGIN,
        'https://nouryaakpool.netlify.app'
      ].filter(Boolean) as string[],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Join rooms based on user role
    socket.on('join:role', (role: string) => {
      socket.join(`role:${role}`);
      console.log(`👤 Socket ${socket.id} joined role:${role}`);
    });

    // Join table-specific room
    socket.on('join:table', (tableId: string) => {
      socket.join(`table:${tableId}`);
      console.log(`🪑 Socket ${socket.id} joined table:${tableId}`);
    });

    // Leave table room
    socket.on('leave:table', (tableId: string) => {
      socket.leave(`table:${tableId}`);
      console.log(`🪑 Socket ${socket.id} left table:${tableId}`);
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`🔌 Client disconnected: ${socket.id} (${reason})`);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`❌ Socket error for ${socket.id}:`, error);
    });
  });

  console.log('🔌 Socket.io initialized');
  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initializeSocket first.');
  }
  return io;
}

// Event emitter helpers
export const socketEvents = {
  // Order events
  ORDER_CREATED: 'order:created',
  ORDER_UPDATED: 'order:updated',
  ORDER_STATUS_CHANGED: 'order:status_changed',
  ORDER_PAID: 'order:paid',
  ORDER_DELETED: 'order:deleted',

  // Table events
  TABLE_STATUS_CHANGED: 'table:status_changed',
  TABLE_ASSIGNED: 'table:assigned',

  // Pool events
  POOL_SESSION_STARTED: 'pool:session_started',
  POOL_SESSION_UPDATED: 'pool:sessionUpdated',
  POOL_SESSION_ENDED: 'pool:sessionEnded',

  // Sync events
  SYNC_STARTED: 'sync:started',
  SYNC_PROGRESS: 'sync:progress',
  SYNC_COMPLETED: 'sync:completed',
  SYNC_FAILED: 'sync:failed',
};

// Broadcast to all connected clients
export function broadcast(event: string, data: unknown): void {
  if (io) {
    io.emit(event, data);
  }
}

// Broadcast to specific role
export function broadcastToRole(role: string, event: string, data: unknown): void {
  if (io) {
    io.to(`role:${role}`).emit(event, data);
  }
}

// Broadcast to specific table
export function broadcastToTable(tableId: string, event: string, data: unknown): void {
  if (io) {
    io.to(`table:${tableId}`).emit(event, data);
  }
}

export default {
  initializeSocket,
  getIO,
  socketEvents,
  broadcast,
  broadcastToRole,
  broadcastToTable
};
