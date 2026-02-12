// ============================================
// Order Service
// ============================================

import { Order, type IOrderDocument } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { CafeTable } from '../models/CafeTable.js';
import { ApiError } from '../middleware/error.middleware.js';
import { broadcast, broadcastToRole, socketEvents } from '../config/socket.js';
import type { CreateOrderInput, AddItemsInput, UpdateStatusInput } from '../validators/order.validator.js';
import type { IOrderItem, OrderStatus } from '../types/index.js';

// Create new order
export async function createOrder(
  input: CreateOrderInput,
  waiterId: string,
  waiterName: string
): Promise<IOrderDocument> {
  // Verify table exists and is available
  const table = await CafeTable.findById(input.tableId);
  if (!table) {
    throw new ApiError(404, 'Table not found');
  }

  // Allow creation unless paid (which should technically be free, but just in case)
  // If status is new/ordered, ideally we should add items, but if client requests createOrder, we allow it.
  // User specific request: preparing, ready, served -> create new order.
  // So effectively, we allow createOrder for almost any status except maybe 'paid' if it implies locked?
  // But table status 'paid' usually assumes it will become free soon.
  // Actually, let's just allow it for all except 'free' check which we handle logic for.
  // The constraint was:
  // if (table.status !== 'free' && table.status !== 'paid' && table.status !== 'served')
  // We remove the restriction for preparing and ready.

  const validStatuses = ['free', 'paid', 'served', 'preparing', 'ready', 'ordered'];
  if (!validStatuses.includes(table.status)) {
    // This check is effectively allowing almost everything.
    // Let's just remove the blocking check for occupied tables.
  }

  // Actually, createOrder overwrites currentOrderId.
  // Logic: 
  // If table.status is 'free' or 'paid' -> It's a fresh start.
  // If table.status is 'ordered' (new), 'preparing', 'ready', 'served' -> It's a new order on top.

  // So we just need to ensure table exists.
  // The previous restriction was to prevent accidental overwrites, but new requirement allows it.


  // Build order items with product details
  const orderItems: IOrderItem[] = [];

  for (const item of input.items) {
    const product = await Product.findById(item.productId);
    if (!product) {
      throw new ApiError(404, `Product not found: ${item.productId}`);
    }
    if (!product.isAvailable) {
      throw new ApiError(400, `Product not available: ${product.name}`);
    }

    orderItems.push({
      productId: product._id,
      aroniumProductId: product.aroniumId || 0,
      productName: product.name,
      quantity: item.quantity,
      unitPrice: product.price,
      notes: item.notes,
      selectedOptions: item.selectedOptions || [],
      sugar: item.sugar,
    });
  }

  // Generate order number
  const orderNumber = await Order.generateOrderNumber();

  // Calculate total
  const total = orderItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  // Create order
  const order = await Order.create({
    orderNumber,
    tableId: input.tableId,
    items: orderItems,
    status: 'new',
    waiterId,
    waiterName,
    total,
    notes: input.notes,
  });

  // Update table status
  await CafeTable.findByIdAndUpdate(input.tableId, {
    status: 'ordered',
    currentOrderId: order._id,
    waiterId,
    waiterName,
  });

  // Broadcast to bartenders
  broadcast(socketEvents.ORDER_CREATED, {
    order: order.toJSON(),
    table: table.toJSON(),
  });

  return order;
}

// Get order by ID
export async function getOrderById(orderId: string): Promise<IOrderDocument | null> {
  return Order.findById(orderId)
    .populate('tableId')
    .populate('waiterId', 'name');
}

// Get active orders (not paid)
export async function getActiveOrders(waiterId?: string): Promise<IOrderDocument[]> {
  const query: any = {
    status: { $in: ['new', 'preparing', 'ready', 'served'] }
  };

  if (waiterId) {
    query.waiterId = waiterId;
  }

  return Order.find(query)
    .populate('tableId')
    .populate('waiterId', 'name')
    .sort({ createdAt: -1 });
}

// Get orders by status
export async function getOrdersByStatus(status: OrderStatus, waiterId?: string): Promise<IOrderDocument[]> {
  const query: any = { status };

  if (waiterId) {
    query.waiterId = waiterId;
  }

  return Order.find(query)
    .populate('tableId')
    .populate('waiterId', 'name')
    .sort({ createdAt: -1 });
}

// Get orders by table
export async function getOrdersByTable(tableId: string, waiterId?: string): Promise<IOrderDocument[]> {
  const query: any = {
    tableId
  };

  if (waiterId) {
    query.waiterId = waiterId;
  }

  return Order.find(query)
    .populate('tableId')
    .populate('waiterId', 'name')
    .sort({ createdAt: -1 });
}

// Update order status
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<IOrderDocument> {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  // Validate status transition
  const validTransitions: Record<OrderStatus, OrderStatus[]> = {
    new: ['preparing'],
    preparing: ['ready'],
    ready: ['served'],
    served: ['paid'],
    paid: [], // Terminal state
  };

  if (!validTransitions[order.status].includes(status)) {
    throw new ApiError(400, `Cannot change status from ${order.status} to ${status}`);
  }

  // Update order
  order.status = status;
  if (status === 'paid') {
    order.paidAt = new Date();
  }
  await order.save();

  // Update table status
  let tableStatus: string = status;
  if (status === 'paid') {
    tableStatus = 'free';
    const table = await CafeTable.findById(order.tableId);
    if (table && table.currentOrderId && table.currentOrderId.toString() === orderId) {
      await CafeTable.findByIdAndUpdate(order.tableId, {
        status: 'free',
        currentOrderId: null,
        waiterId: null,
        waiterName: null,
      });
    }
  } else {
    // Only update status if it's the current order
    const table = await CafeTable.findById(order.tableId);
    if (table && table.currentOrderId && table.currentOrderId.toString() === orderId) {
      await CafeTable.findByIdAndUpdate(order.tableId, { status });
    }
  }

  // Broadcast status change
  broadcast(socketEvents.ORDER_STATUS_CHANGED, {
    orderId: order._id,
    orderNumber: order.orderNumber,
    status,
    tableId: order.tableId,
  });

  // Notify waiter when order is ready
  if (status === 'ready') {
    broadcastToRole('waiter', socketEvents.ORDER_STATUS_CHANGED, {
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: 'ready',
      message: `Order ${order.orderNumber} is ready!`,
    });
  }

  return order;
}

// Release table (keep order unpaid)
export async function releaseTable(orderId: string): Promise<void> {
  const table = await CafeTable.findOne({ currentOrderId: orderId });

  if (table) {
    await CafeTable.findByIdAndUpdate(table._id, {
      status: 'free',
      currentOrderId: null,
      waiterId: null,
      waiterName: null,
    });

    // Notify table update with full data to ensure frontend syncs correctly
    broadcast(socketEvents.TABLE_STATUS_CHANGED, {
      tableId: table._id,
      number: table.number,
      status: 'free'
    });
  }
}

// Add items to existing order
export async function addItemsToOrder(
  orderId: string,
  input: AddItemsInput
): Promise<IOrderDocument> {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  if (order.status === 'paid') {
    throw new ApiError(400, 'Cannot add items to paid order');
  }

  // Build new items
  for (const item of input.items) {
    const product = await Product.findById(item.productId);
    if (!product) {
      throw new ApiError(404, `Product not found: ${item.productId}`);
    }
    if (!product.isAvailable) {
      throw new ApiError(400, `Product not available: ${product.name}`);
    }

    // Check if product already in order
    const existingItem = order.items.find(
      i => i.productId.toString() === item.productId
    );

    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      order.items.push({
        productId: product._id,
        aroniumProductId: product.aroniumId || 0,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: product.price,
        notes: item.notes,
        selectedOptions: item.selectedOptions || [],
        sugar: item.sugar,
      });
    }
  }

  // Recalculate total
  order.total = order.calculateTotal();
  await order.save();

  // Broadcast update
  broadcast(socketEvents.ORDER_UPDATED, {
    order: order.toJSON(),
  });

  return order;
}

// Get orders for today
export async function getTodayOrders(): Promise<IOrderDocument[]> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  return Order.find({ createdAt: { $gte: startOfDay } })
    .populate('tableId')
    .sort({ createdAt: -1 });
}

// Get order statistics
export async function getOrderStats(): Promise<{
  total: number;
  byStatus: Record<OrderStatus, number>;
  revenue: number;
}> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const orders = await Order.find({ createdAt: { $gte: startOfDay } });

  const byStatus: Record<OrderStatus, number> = {
    new: 0,
    preparing: 0,
    ready: 0,
    served: 0,
    paid: 0,
  };

  let revenue = 0;

  for (const order of orders) {
    byStatus[order.status]++;
    if (order.status === 'paid') {
      revenue += order.total;
    }
  }

  return {
    total: orders.length,
    byStatus,
    revenue,
  };
}

// Get orders history with date range and optional waiter filtering
export async function getOrdersHistory({
  startDate,
  endDate,
  waiterId,
  page = 1,
  limit = 10
}: {
  startDate: Date;
  endDate: Date;
  waiterId?: string;
  page?: number;
  limit?: number;
}) {
  const query: any = {
    createdAt: { $gte: startDate, $lte: endDate }
  };

  if (waiterId) {
    query.waiterId = waiterId;
  }

  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate('tableId', 'number')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(query)
  ]);

  return {
    orders,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    total
  };
}

// Cancel/Delete order
export async function cancelOrder(orderId: string): Promise<void> {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  // Allow cancellation for new, preparing, and ready statuses
  const cancellableStatuses: OrderStatus[] = ['new', 'preparing', 'ready'];
  if (!cancellableStatuses.includes(order.status)) {
    throw new ApiError(400, `Cannot cancel order with status: ${order.status}`);
  }

  // Delete the order
  await Order.deleteOne({ _id: order._id });

  // Reset table status to free
  await CafeTable.findByIdAndUpdate(order.tableId, {
    status: 'free',
    currentOrderId: null,
    waiterId: null,
    waiterName: null,
  });

  // Broadcast cancellation
  broadcast(socketEvents.ORDER_DELETED, {
    orderId: order._id,
    tableId: order.tableId,
  });
}

// Archive order (hide from table view but keep for history)
export async function archiveOrder(orderId: string): Promise<IOrderDocument> {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  order.isArchived = true;
  await order.save();

  // Re-use releaseTable logic to free the table if this was the active order
  await releaseTable(orderId);

  return order;
}

export default {
  createOrder,
  getOrderById,
  getActiveOrders,
  getOrdersByStatus,
  getOrdersByTable,
  updateOrderStatus,
  addItemsToOrder,
  getTodayOrders,
  getOrderStats,
  getOrdersHistory,
  cancelOrder,
  archiveOrder,
};
