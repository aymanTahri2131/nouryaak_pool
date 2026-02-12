// ============================================
// Socket Order Handlers
// ============================================

import { Socket } from 'socket.io';
import { Order } from '../../models/Order.js';
import { CafeTable } from '../../models/CafeTable.js';
import { socketEvents, broadcastToRole, broadcast } from '../../config/socket.js';

export function registerOrderHandlers(socket: Socket): void {
  // Subscribe to order updates for a specific table
  socket.on('order:subscribe', async (tableId: string) => {
    socket.join(`table:${tableId}`);
    console.log(`🔔 Socket ${socket.id} subscribed to table ${tableId}`);
    
    // Send current order status
    const table = await CafeTable.findById(tableId).populate('currentOrderId');
    if (table) {
      socket.emit('order:current', { table, order: table.currentOrderId });
    }
  });

  // Unsubscribe from table
  socket.on('order:unsubscribe', (tableId: string) => {
    socket.leave(`table:${tableId}`);
    console.log(`🔕 Socket ${socket.id} unsubscribed from table ${tableId}`);
  });

  // Request active orders (bartender view)
  socket.on('order:getActive', async () => {
    const orders = await Order.findActive();
    socket.emit('order:activeList', { orders });
  });

  // Request orders by status
  socket.on('order:getByStatus', async (status: string) => {
    const orders = await Order.find({ status })
      .populate('tableId')
      .sort({ createdAt: -1 });
    socket.emit('order:listByStatus', { status, orders });
  });
}

// Utility function to emit order events
export function emitOrderCreated(order: any, table: any): void {
  // Broadcast to all bartenders
  broadcastToRole('bartender', socketEvents.ORDER_CREATED, { order, table });
  
  // Broadcast to admin
  broadcastToRole('admin', socketEvents.ORDER_CREATED, { order, table });
}

export function emitOrderStatusChanged(orderId: string, status: string, tableId: string): void {
  // Broadcast to everyone
  broadcast(socketEvents.ORDER_STATUS_CHANGED, { orderId, status, tableId });
}

export function emitOrderReady(order: any): void {
  // Special notification for waiters when order is ready
  broadcastToRole('waiter', socketEvents.ORDER_STATUS_CHANGED, {
    orderId: order._id,
    orderNumber: order.orderNumber,
    status: 'ready',
    tableId: order.tableId,
    alert: true,
    message: `Order ${order.orderNumber} is ready for service!`,
  });
}

export default { registerOrderHandlers, emitOrderCreated, emitOrderStatusChanged, emitOrderReady };
