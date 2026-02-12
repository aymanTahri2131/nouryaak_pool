// ============================================
// Socket.io Setup
// ============================================

import { Server } from 'socket.io';
import { registerOrderHandlers } from './handlers/order.handler.js';
import { registerTableHandlers } from './handlers/table.handler.js';
import { registerPoolHandlers } from './handlers/pool.handler.js';

export function setupSocketHandlers(io: Server): void {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Register handlers
    registerOrderHandlers(socket);
    registerTableHandlers(socket);
    registerPoolHandlers(socket);

    // Join room based on role
    socket.on('auth:role', (role: string) => {
      socket.join(`role:${role}`);
      console.log(`👤 Socket ${socket.id} joined role: ${role}`);
    });

    // Handle ping/pong for connection health
    socket.on('ping', () => {
      socket.emit('pong');
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

  console.log('✅ Socket handlers registered');
}

// Re-export handlers
export * from './handlers/order.handler.js';
export * from './handlers/table.handler.js';
export * from './handlers/pool.handler.js';
