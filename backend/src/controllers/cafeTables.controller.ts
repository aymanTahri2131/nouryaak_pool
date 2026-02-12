// ============================================
// Cafe Tables Controller
// ============================================

import { Request, Response } from 'express';
import { asyncHandler, ApiError } from '../middleware/error.middleware.js';
import * as tableService from '../services/table.service.js';

// GET /api/cafe-tables
export const getAllTables = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.query;
  const userRole = req.user?.role;

  let tables;
  if (status) {
    tables = await tableService.getTablesByStatus(status as any, req.userId, userRole);
  } else {
    tables = await tableService.getAllTables(req.userId, userRole);
  }

  res.json({
    success: true,
    data: { tables },
  });
});

// GET /api/cafe-tables/free
export const getFreeTables = asyncHandler(async (req: Request, res: Response) => {
  const tables = await tableService.getFreeTables(req.userId, req.user?.role);

  res.json({
    success: true,
    data: { tables },
  });
});

// GET /api/cafe-tables/stats
export const getTableStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await tableService.getTableStats();

  res.json({
    success: true,
    data: { stats },
  });
});

// GET /api/cafe-tables/:id
export const getTableById = asyncHandler(async (req: Request, res: Response) => {
  const { table, order } = await tableService.getTableWithOrder(
    req.params.id as string,
    req.userId,
    req.user?.role
  );

  res.json({
    success: true,
    data: { table, order },
    order, // include order at root for mapper compatibility if needed, but data.order is standard
  });
});

// POST /api/cafe-tables (admin only)
export const createTable = asyncHandler(async (req: Request, res: Response) => {
  const { number, name, capacity } = req.body;
  const table = await tableService.createTable({ number, name, capacity });

  res.status(201).json({
    success: true,
    data: { table },
    message: 'Table created successfully',
  });
});

// PATCH /api/cafe-tables/:id/status
export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.body;
  const table = await tableService.updateTableStatus(req.params.id as string, status);

  res.json({
    success: true,
    data: { table },
    message: `Table status updated to ${status}`,
  });
});

// PATCH /api/cafe-tables/:id/assign
export const assignWaiter = asyncHandler(async (req: Request, res: Response) => {
  const { waiterId, waiterName } = req.body;
  const table = await tableService.assignWaiter(req.params.id as string, waiterId, waiterName);

  res.json({
    success: true,
    data: { table },
    message: 'Waiter assigned successfully',
  });
});

// POST /api/cafe-tables/:id/free
export const freeTable = asyncHandler(async (req: Request, res: Response) => {
  const table = await tableService.freeTable(req.params.id as string);

  res.json({
    success: true,
    data: { table },
    message: 'Table is now free',
  });
});

// POST /api/cafe-tables/:id/pay-all
export const payAll = asyncHandler(async (req: Request, res: Response) => {
  await tableService.payAllOrders(req.params.id as string);

  res.json({
    success: true,
    message: 'All orders paid successfully',
  });
});

// PATCH /api/cafe-tables/:id (admin only)
export const updateTable = asyncHandler(async (req: Request, res: Response) => {
  const { number, name, capacity } = req.body;
  const table = await tableService.updateTable(req.params.id as string, { number, name, capacity });

  res.json({
    success: true,
    data: { table },
    message: 'Table updated successfully',
  });
});

// DELETE /api/cafe-tables/:id (admin only)
export const deleteTable = asyncHandler(async (req: Request, res: Response) => {
  await tableService.deleteTable(req.params.id as string);

  res.json({
    success: true,
    message: 'Table deleted successfully',
  });
});

export default {
  getAllTables,
  getFreeTables,
  getTableStats,
  getTableById,
  createTable,
  updateTable,
  updateStatus,
  assignWaiter,
  freeTable,
  payAll,
  deleteTable,
};
