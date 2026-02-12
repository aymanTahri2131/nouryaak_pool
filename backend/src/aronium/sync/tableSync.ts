// ============================================
// Table Sync - Import FloorPlanTable from Aronium
// ============================================

import { CafeTable } from '../../models/CafeTable.js';
import { SyncStatus } from '../../models/SyncStatus.js';
import { getAllTables, getAllFloorPlans, getTablesCount } from '../schemas/floorPlan.js';
import { broadcast, socketEvents } from '../../config/socket.js';
import type { AroniumFloorPlanTable, AroniumFloorPlan } from '../../types/aronium.js';

export interface TableSyncResult {
  success: boolean;
  created: number;
  updated: number;
  total: number;
  error?: string;
}

export async function syncTables(): Promise<TableSyncResult> {
  const result: TableSyncResult = {
    success: false,
    created: 0,
    updated: 0,
    total: 0,
  };

  // Create sync status record
  const syncStatus = await SyncStatus.startSync('tables');

  try {
    // Broadcast sync started
    broadcast(socketEvents.SYNC_STARTED, { type: 'tables' });

    // Get tables from Aronium
    const aroniumTables = getAllTables();
    result.total = aroniumTables.length;
    syncStatus.itemsTotal = result.total;
    await syncStatus.save();

    if (aroniumTables.length === 0) {
      console.log('⚠️  No tables found in Aronium');
      syncStatus.status = 'completed';
      syncStatus.completedAt = new Date();
      await syncStatus.save();
      result.success = true;
      return result;
    }

    console.log(`📦 Syncing ${aroniumTables.length} tables from Aronium...`);

    // Get floor plans for reference
    const floorPlans = getAllFloorPlans();
    const floorPlanMap = new Map<number, string>();
    floorPlans.forEach(fp => floorPlanMap.set(fp.Id, fp.Name));

    // Process tables
    for (let i = 0; i < aroniumTables.length; i++) {
      const aroniumTable = aroniumTables[i];
      const existing = await CafeTable.findByAroniumId(aroniumTable.Id);

      // Extract table number from name or use index
      const tableNumber = extractTableNumber(aroniumTable.Name) || i + 1;

      const tableData = {
        aroniumId: aroniumTable.Id,
        number: tableNumber,
        name: aroniumTable.Name,
        capacity: 4, // Default capacity (Aronium doesn't store this)
        floorPlanId: aroniumTable.FloorPlanId,
        positionX: aroniumTable.PositionX,
        positionY: aroniumTable.PositionY,
        lastSyncedAt: new Date(),
      };

      if (existing) {
        // Don't overwrite status during sync
        await CafeTable.updateOne(
          { _id: existing._id },
          { 
            $set: {
              name: tableData.name,
              floorPlanId: tableData.floorPlanId,
              positionX: tableData.positionX,
              positionY: tableData.positionY,
              lastSyncedAt: tableData.lastSyncedAt,
            }
          }
        );
        result.updated++;
      } else {
        await CafeTable.create({
          ...tableData,
          status: 'free',
        });
        result.created++;
      }

      // Update progress
      syncStatus.itemsProcessed = result.created + result.updated;
      await syncStatus.save();

      // Broadcast progress
      broadcast(socketEvents.SYNC_PROGRESS, {
        type: 'tables',
        processed: syncStatus.itemsProcessed,
        total: syncStatus.itemsTotal,
      });
    }

    result.success = true;
    syncStatus.status = 'completed';
    syncStatus.completedAt = new Date();
    await syncStatus.save();

    // Broadcast sync completed
    broadcast(socketEvents.SYNC_COMPLETED, {
      type: 'tables',
      result,
    });

    console.log(`✅ Table sync complete: ${result.created} created, ${result.updated} updated`);

  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error';
    syncStatus.status = 'failed';
    syncStatus.error = result.error;
    syncStatus.completedAt = new Date();
    await syncStatus.save();

    // Broadcast sync failed
    broadcast(socketEvents.SYNC_FAILED, {
      type: 'tables',
      error: result.error,
    });

    console.error('❌ Table sync failed:', error);
  }

  return result;
}

// Helper to extract number from table name (e.g., "Table 5" -> 5)
function extractTableNumber(name: string): number | null {
  const match = name.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

export default { syncTables };
