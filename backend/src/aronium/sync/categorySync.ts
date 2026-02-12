// ============================================
// Category Sync - Import ProductGroup from Aronium
// ============================================

import { Category } from '../../models/Category.js';
import { SyncStatus } from '../../models/SyncStatus.js';
import { getAllProductGroups, getProductGroupsCount } from '../schemas/productGroup.js';
import { broadcast, socketEvents } from '../../config/socket.js';
import type { AroniumProductGroup } from '../../types/aronium.js';

export interface CategorySyncResult {
  success: boolean;
  created: number;
  updated: number;
  total: number;
  error?: string;
}

export async function syncCategories(): Promise<CategorySyncResult> {
  const result: CategorySyncResult = {
    success: false,
    created: 0,
    updated: 0,
    total: 0,
  };

  // Create sync status record
  const syncStatus = await SyncStatus.startSync('categories');

  try {
    // Broadcast sync started
    broadcast(socketEvents.SYNC_STARTED, { type: 'categories' });

    // Get categories from Aronium
    const aroniumCategories = getAllProductGroups();
    result.total = aroniumCategories.length;
    syncStatus.itemsTotal = result.total;
    await syncStatus.save();

    if (aroniumCategories.length === 0) {
      console.log('⚠️  No categories found in Aronium');
      syncStatus.status = 'completed';
      syncStatus.completedAt = new Date();
      await syncStatus.save();
      result.success = true;
      return result;
    }

    console.log(`📦 Syncing ${aroniumCategories.length} categories from Aronium...`);

    // First pass: Create/update categories without parent references
    const categoryMap = new Map<number, string>(); // aroniumId -> mongoId

    for (const aroniumCat of aroniumCategories) {
      const existing = await Category.findByAroniumId(aroniumCat.Id);

      const categoryData = {
        aroniumId: aroniumCat.Id,
        name: aroniumCat.Name,
        nameEn: aroniumCat.Name,
        nameFr: aroniumCat.Name, // Could be translated later
        color: aroniumCat.Color || 'Transparent',
        order: aroniumCat.Rank || 0,
        lastSyncedAt: new Date(),
      };

      if (existing) {
        await Category.updateOne({ _id: existing._id }, categoryData);
        categoryMap.set(aroniumCat.Id, existing._id.toString());
        result.updated++;
      } else {
        const newCategory = await Category.create(categoryData);
        categoryMap.set(aroniumCat.Id, newCategory._id.toString());
        result.created++;
      }

      // Update progress
      syncStatus.itemsProcessed = result.created + result.updated;
      await syncStatus.save();

      // Broadcast progress
      broadcast(socketEvents.SYNC_PROGRESS, {
        type: 'categories',
        processed: syncStatus.itemsProcessed,
        total: syncStatus.itemsTotal,
      });
    }

    // Second pass: Update parent references
    for (const aroniumCat of aroniumCategories) {
      if (aroniumCat.ParentGroupId) {
        const parentMongoId = categoryMap.get(aroniumCat.ParentGroupId);
        if (parentMongoId) {
          await Category.updateOne(
            { aroniumId: aroniumCat.Id },
            { parentId: parentMongoId }
          );
        }
      }
    }

    result.success = true;
    syncStatus.status = 'completed';
    syncStatus.completedAt = new Date();
    await syncStatus.save();

    // Broadcast sync completed
    broadcast(socketEvents.SYNC_COMPLETED, {
      type: 'categories',
      result,
    });

    console.log(`✅ Category sync complete: ${result.created} created, ${result.updated} updated`);

  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error';
    syncStatus.status = 'failed';
    syncStatus.error = result.error;
    syncStatus.completedAt = new Date();
    await syncStatus.save();

    // Broadcast sync failed
    broadcast(socketEvents.SYNC_FAILED, {
      type: 'categories',
      error: result.error,
    });

    console.error('❌ Category sync failed:', error);
  }

  return result;
}

export default { syncCategories };
