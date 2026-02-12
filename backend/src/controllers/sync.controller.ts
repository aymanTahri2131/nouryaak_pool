// ============================================
// Sync Controller
// ============================================

import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware.js';
import {
  syncAll,
  syncCategories,
  syncProducts,
  syncTables,
  getSyncStatus,
} from '../aronium/sync/index.js';
import {
  exportOrderToAronium,
  exportPoolSessionToAronium,
  exportPendingOrders,
} from '../aronium/export/orderExport.js';
import { testAroniumConnection } from '../aronium/connection.js';

// GET /api/sync/status
export const getStatus = asyncHandler(async (req: Request, res: Response) => {
  const status = await getSyncStatus();

  res.json({
    success: true,
    data: status,
  });
});

// GET /api/sync/test
export const testConnection = asyncHandler(async (req: Request, res: Response) => {
  const result = testAroniumConnection();

  res.json({
    success: result.connected,
    data: result,
  });
});

// POST /api/sync/all
export const syncAllData = asyncHandler(async (req: Request, res: Response) => {
  const result = await syncAll();

  res.json({
    success: result.success,
    data: result,
    message: result.success
      ? 'Full sync completed successfully'
      : `Sync failed: ${result.error}`,
  });
});

// POST /api/sync/categories
export const syncCategoriesOnly = asyncHandler(async (req: Request, res: Response) => {
  const result = await syncCategories();

  res.json({
    success: result.success,
    data: result,
    message: result.success
      ? `Synced ${result.created + result.updated} categories`
      : `Sync failed: ${result.error}`,
  });
});

// POST /api/sync/products
export const syncProductsOnly = asyncHandler(async (req: Request, res: Response) => {
  const result = await syncProducts();

  res.json({
    success: result.success,
    data: result,
    message: result.success
      ? `Synced ${result.created + result.updated} products`
      : `Sync failed: ${result.error}`,
  });
});

// POST /api/sync/tables
export const syncTablesOnly = asyncHandler(async (req: Request, res: Response) => {
  const result = await syncTables();

  res.json({
    success: result.success,
    data: result,
    message: result.success
      ? `Synced ${result.created + result.updated} tables`
      : `Sync failed: ${result.error}`,
  });
});

// POST /api/sync/export/order/:orderId
export const exportOrder = asyncHandler(async (req: Request, res: Response) => {
  const result = await exportOrderToAronium(req.params.orderId as string);

  res.json({
    success: result.success,
    data: result,
    message: result.success
      ? 'Order exported to Aronium successfully'
      : `Export failed: ${result.error}`,
  });
});

// POST /api/sync/export/pool/:sessionId
export const exportPoolSession = asyncHandler(async (req: Request, res: Response) => {
  const result = await exportPoolSessionToAronium(req.params.sessionId as string);

  res.json({
    success: result.success,
    data: result,
    message: result.success
      ? 'Pool session exported to Aronium successfully'
      : `Export failed: ${result.error}`,
  });
});

// POST /api/sync/export/pending
export const exportPending = asyncHandler(async (req: Request, res: Response) => {
  const result = await exportPendingOrders();

  res.json({
    success: result.failed === 0,
    data: result,
    message: `Exported ${result.exported} items, ${result.failed} failed`,
  });
});

// POST /api/sync/cleanup-indexes
export const cleanupIndexes = asyncHandler(async (req: Request, res: Response) => {
  const mongoose = await import('mongoose');
  let results: any = {};

  if (mongoose.default.connection.db) {
    try {
      await mongoose.default.connection.db.collection('products').dropIndex('aroniumId_1');
      results.products = 'Dropped';
    } catch (e) {
      results.products = 'Not found or failed';
    }

    try {
      await mongoose.default.connection.db.collection('categories').dropIndex('aroniumId_1');
      results.categories = 'Dropped';
    } catch (e) {
      results.categories = 'Not found or failed';
    }
  }

  res.json({
    success: true,
    data: results,
    message: 'Index cleanup attempt completed',
  });
});

export default {
  getStatus,
  testConnection,
  syncAllData,
  syncCategoriesOnly,
  syncProductsOnly,
  syncTablesOnly,
  exportPending,
  cleanupIndexes,
};
