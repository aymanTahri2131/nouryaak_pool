// ============================================
// Orders Controller
// ============================================

import { Request, Response } from 'express';
import { asyncHandler, ApiError } from '../middleware/error.middleware.js';
import * as orderService from '../services/order.service.js';
import type { CreateOrderInput, AddItemsInput, UpdateStatusInput } from '../validators/order.validator.js';

// GET /api/orders
export const getOrders = asyncHandler(async (req: Request, res: Response) => {
  const { status, tableId } = req.query;
  const userRole = req.user?.role;

  // Default filter: Waiters only see their own orders.
  // Special case: Admins viewing a specific table also only see their own orders.
  let waiterId = userRole === 'waiter' ? req.userId : undefined;
  if (userRole === 'admin' && tableId) {
    waiterId = req.userId;
  }

  let orders;

  if (status) {
    orders = await orderService.getOrdersByStatus(status as any, waiterId);
  } else if (tableId) {
    orders = await orderService.getOrdersByTable(tableId as string, waiterId);
  } else {
    orders = await orderService.getActiveOrders(waiterId);
  }

  res.json({
    success: true,
    data: { orders },
  });
});

// GET /api/orders/active
export const getActiveOrders = asyncHandler(async (req: Request, res: Response) => {
  const userRole = req.user?.role;
  const waiterId = userRole === 'waiter' ? req.userId : undefined;

  const orders = await orderService.getActiveOrders(waiterId);

  res.json({
    success: true,
    data: { orders },
  });
});

// GET /api/orders/today
export const getTodayOrders = asyncHandler(async (req: Request, res: Response) => {
  const orders = await orderService.getTodayOrders();

  res.json({
    success: true,
    data: { orders },
  });
});

// GET /api/orders/stats
export const getOrderStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await orderService.getOrderStats();

  res.json({
    success: true,
    data: { stats },
  });
});

// GET /api/orders/history
export const getOrdersHistory = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate, waiterId, page = 1, limit = 10 } = req.query;

  const end = new Date(endDate as string);
  end.setHours(23, 59, 59, 999);

  const result = await orderService.getOrdersHistory({
    startDate: new Date(startDate as string),
    endDate: end,
    waiterId: waiterId as string,
    page: parseInt(page as string),
    limit: parseInt(limit as string)
  });

  res.json({ success: true, data: result });
});

// GET /api/orders/:id
export const getOrderById = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.getOrderById(req.params.id as string);

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  res.json({
    success: true,
    data: { order },
  });
});

// POST /api/orders
export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as CreateOrderInput;
  const order = await orderService.createOrder(
    input,
    req.userId!,
    req.user!.name
  );

  res.status(201).json({
    success: true,
    data: { order },
    message: 'Order created successfully',
  });
});

// POST /api/orders/:id/items
export const addItems = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as AddItemsInput;
  const order = await orderService.addItemsToOrder(req.params.id as string, input);

  res.json({
    success: true,
    data: { order },
    message: 'Items added successfully',
  });
});

// PATCH /api/orders/:id/status
export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.body as UpdateStatusInput;
  const userRole = req.user?.role;

  // Role-based restrictions
  if (userRole !== 'admin') {
    const bartenderStatuses = ['preparing', 'ready'];
    const waiterStatuses = ['served', 'paid'];

    if (userRole === 'waiter' && bartenderStatuses.includes(status)) {
      throw new ApiError(403, 'Waiters cannot mark orders as preparing or ready');
    }

    if (userRole === 'bartender' && waiterStatuses.includes(status)) {
      throw new ApiError(403, 'Bartenders cannot mark orders as served or paid');
    }
  }

  const order = await orderService.updateOrderStatus(req.params.id as string, status);

  res.json({
    success: true,
    data: { order },
    message: `Order status updated to ${status}`,
  });
});

// DELETE /api/orders/:id
// DELETE /api/orders/:id
export const deleteOrder = asyncHandler(async (req: Request, res: Response) => {
  await orderService.cancelOrder(req.params.id as string);

  res.json({
    success: true,
    message: 'Order cancelled successfully',
  });
});

// POST /api/orders/:id/archive
export const archiveOrder = asyncHandler(async (req: Request, res: Response) => {
  await orderService.archiveOrder(req.params.id as string);

  res.json({
    success: true,
    message: 'Order archived successfully',
  });
});

export default {
  getOrders,
  getActiveOrders,
  getTodayOrders,
  getOrderStats,
  getOrdersHistory,
  getOrderById,
  createOrder,
  addItems,
  updateStatus,
  deleteOrder,
  archiveOrder,
};
