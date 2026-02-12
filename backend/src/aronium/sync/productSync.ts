// ============================================
// Product Sync - Import Products from Aronium
// ============================================

import { Product } from '../../models/Product.js';
import { Category } from '../../models/Category.js';
import { SyncStatus } from '../../models/SyncStatus.js';
import { getAllProducts, getProductsCount } from '../schemas/product.js';
import { broadcast, socketEvents } from '../../config/socket.js';
import type { AroniumProduct } from '../../types/aronium.js';

export interface ProductSyncResult {
  success: boolean;
  created: number;
  updated: number;
  skipped: number;
  total: number;
  error?: string;
}

export async function syncProducts(): Promise<ProductSyncResult> {
  const result: ProductSyncResult = {
    success: false,
    created: 0,
    updated: 0,
    skipped: 0,
    total: 0,
  };

  // Create sync status record
  const syncStatus = await SyncStatus.startSync('products');

  try {
    // Broadcast sync started
    broadcast(socketEvents.SYNC_STARTED, { type: 'products' });

    // Get products from Aronium
    const aroniumProducts = getAllProducts();
    result.total = aroniumProducts.length;
    syncStatus.itemsTotal = result.total;
    await syncStatus.save();

    if (aroniumProducts.length === 0) {
      console.log('⚠️  No products found in Aronium');
      syncStatus.status = 'completed';
      syncStatus.completedAt = new Date();
      await syncStatus.save();
      result.success = true;
      return result;
    }

    console.log(`📦 Syncing ${aroniumProducts.length} products from Aronium...`);

    // Build category map for quick lookups
    const categories = await Category.find({});
    const categoryMap = new Map<number, string>();
    categories.forEach(cat => {
      categoryMap.set(cat.aroniumId, cat._id.toString());
    });

    // Process products
    for (const aroniumProd of aroniumProducts) {
      // Find corresponding MongoDB category
      const categoryId = aroniumProd.ProductGroupId 
        ? categoryMap.get(aroniumProd.ProductGroupId)
        : null;

      if (!categoryId) {
        console.warn(`⚠️  Skipping product "${aroniumProd.Name}" - no category found for group ${aroniumProd.ProductGroupId}`);
        result.skipped++;
        continue;
      }

      const existing = await Product.findByAroniumId(aroniumProd.Id);

      const productData = {
        aroniumId: aroniumProd.Id,
        name: aroniumProd.Name,
        code: aroniumProd.Code || undefined,
        plu: aroniumProd.PLU || undefined,
        categoryId: categoryId,
        price: aroniumProd.Price || 0,
        isAvailable: aroniumProd.IsEnabled === 1,
        color: aroniumProd.Color || 'Transparent',
        lastSyncedAt: new Date(),
      };

      if (existing) {
        await Product.updateOne({ _id: existing._id }, productData);
        result.updated++;
      } else {
        await Product.create(productData);
        result.created++;
      }

      // Update progress
      syncStatus.itemsProcessed = result.created + result.updated + result.skipped;
      await syncStatus.save();

      // Broadcast progress (every 10 items to reduce noise)
      if (syncStatus.itemsProcessed % 10 === 0) {
        broadcast(socketEvents.SYNC_PROGRESS, {
          type: 'products',
          processed: syncStatus.itemsProcessed,
          total: syncStatus.itemsTotal,
        });
      }
    }

    result.success = true;
    syncStatus.status = 'completed';
    syncStatus.completedAt = new Date();
    await syncStatus.save();

    // Broadcast sync completed
    broadcast(socketEvents.SYNC_COMPLETED, {
      type: 'products',
      result,
    });

    console.log(`✅ Product sync complete: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped`);

  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error';
    syncStatus.status = 'failed';
    syncStatus.error = result.error;
    syncStatus.completedAt = new Date();
    await syncStatus.save();

    // Broadcast sync failed
    broadcast(socketEvents.SYNC_FAILED, {
      type: 'products',
      error: result.error,
    });

    console.error('❌ Product sync failed:', error);
  }

  return result;
}

export default { syncProducts };
