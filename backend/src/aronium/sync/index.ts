// ============================================
// Aronium Sync - Main Export & Full Sync
// ============================================

import { syncCategories, type CategorySyncResult } from './categorySync.js';
import { syncProducts, type ProductSyncResult } from './productSync.js';
import { syncTables, type TableSyncResult } from './tableSync.js';
import { SyncStatus } from '../../models/SyncStatus.js';
import { broadcast, socketEvents } from '../../config/socket.js';
import { isAroniumConnected, testAroniumConnection } from '../connection.js';

export interface FullSyncResult {
  success: boolean;
  categories: CategorySyncResult | null;
  products: ProductSyncResult | null;
  tables: TableSyncResult | null;
  error?: string;
  duration: number;
}

export async function syncAll(): Promise<FullSyncResult> {
  const startTime = Date.now();
  
  const result: FullSyncResult = {
    success: false,
    categories: null,
    products: null,
    tables: null,
    duration: 0,
  };

  // Create sync status for full sync
  const syncStatus = await SyncStatus.startSync('full');

  try {
    // Test Aronium connection first
    const connectionTest = testAroniumConnection();
    if (!connectionTest.connected) {
      throw new Error(`Aronium database not available: ${connectionTest.error}`);
    }

    console.log('🔄 Starting full Aronium sync...');
    broadcast(socketEvents.SYNC_STARTED, { type: 'full' });

    // Sync categories first (products depend on them)
    console.log('📁 Syncing categories...');
    result.categories = await syncCategories();
    if (!result.categories.success) {
      throw new Error(`Category sync failed: ${result.categories.error}`);
    }

    // Sync products
    console.log('📦 Syncing products...');
    result.products = await syncProducts();
    if (!result.products.success) {
      throw new Error(`Product sync failed: ${result.products.error}`);
    }

    // Sync tables
    console.log('🪑 Syncing tables...');
    result.tables = await syncTables();
    if (!result.tables.success) {
      throw new Error(`Table sync failed: ${result.tables.error}`);
    }

    result.success = true;
    result.duration = Date.now() - startTime;

    syncStatus.status = 'completed';
    syncStatus.completedAt = new Date();
    await syncStatus.save();

    broadcast(socketEvents.SYNC_COMPLETED, {
      type: 'full',
      result,
    });

    console.log(`✅ Full sync completed in ${result.duration}ms`);

  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error';
    result.duration = Date.now() - startTime;

    syncStatus.status = 'failed';
    syncStatus.error = result.error;
    syncStatus.completedAt = new Date();
    await syncStatus.save();

    broadcast(socketEvents.SYNC_FAILED, {
      type: 'full',
      error: result.error,
    });

    console.error('❌ Full sync failed:', error);
  }

  return result;
}

export async function getSyncStatus(): Promise<{
  lastSync: any;
  aronium: {
    connected: boolean;
    readonly: boolean;
    productCount?: number;
    categoryCount?: number;
  };
}> {
  const lastSync = await SyncStatus.getLatest();
  const aroniumStatus = testAroniumConnection();

  return {
    lastSync,
    aronium: aroniumStatus,
  };
}

// Export individual sync functions
export { syncCategories, syncProducts, syncTables };
export type { CategorySyncResult, ProductSyncResult, TableSyncResult };
