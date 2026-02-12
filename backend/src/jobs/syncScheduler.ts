// ============================================
// Sync Scheduler (node-cron)
// ============================================

import cron from 'node-cron';
import { env } from '../config/env.js';
import { syncAll, syncProducts } from '../aronium/sync/index.js';
import { exportPendingOrders } from '../aronium/export/orderExport.js';
import { isAroniumConnected } from '../aronium/connection.js';

let productSyncJob: cron.ScheduledTask | null = null;
let exportJob: cron.ScheduledTask | null = null;

// Start scheduled jobs
export function startScheduledJobs(): void {
  if (!env.AUTO_SYNC_ENABLED) {
    console.log('⏰ Auto-sync is disabled');
    return;
  }

  const intervalMinutes = env.SYNC_INTERVAL_MINUTES;
  
  // Schedule product sync (every X minutes)
  const syncCronExpression = `*/${intervalMinutes} * * * *`;
  
  productSyncJob = cron.schedule(syncCronExpression, async () => {
    console.log('⏰ Running scheduled product sync...');
    
    if (!isAroniumConnected()) {
      console.log('⚠️  Aronium not connected, skipping sync');
      return;
    }

    try {
      const result = await syncProducts();
      console.log(`✅ Scheduled sync completed: ${result.created} created, ${result.updated} updated`);
    } catch (error) {
      console.error('❌ Scheduled sync failed:', error);
    }
  }, {
    scheduled: false, // Don't start immediately
  });

  // Schedule export job (every 5 minutes)
  exportJob = cron.schedule('*/5 * * * *', async () => {
    if (!isAroniumConnected()) return;
    
    console.log('⏰ Running scheduled export...');
    
    try {
      const result = await exportPendingOrders();
      if (result.exported > 0) {
        console.log(`✅ Scheduled export: ${result.exported} exported`);
      }
    } catch (error) {
      console.error('❌ Scheduled export failed:', error);
    }
  }, {
    scheduled: false,
  });

  // Start jobs
  productSyncJob.start();
  exportJob.start();

  console.log(`⏰ Scheduled jobs started (sync every ${intervalMinutes} minutes)`);
}

// Stop scheduled jobs
export function stopScheduledJobs(): void {
  if (productSyncJob) {
    productSyncJob.stop();
    productSyncJob = null;
  }

  if (exportJob) {
    exportJob.stop();
    exportJob = null;
  }

  console.log('⏰ Scheduled jobs stopped');
}

// Run initial sync on startup
export async function runInitialSync(): Promise<void> {
  if (!env.AUTO_SYNC_ENABLED) {
    console.log('⏰ Initial sync skipped (auto-sync disabled)');
    return;
  }

  if (!isAroniumConnected()) {
    console.log('⚠️  Aronium not connected, skipping initial sync');
    return;
  }

  console.log('🔄 Running initial sync...');
  
  try {
    const result = await syncAll();
    if (result.success) {
      console.log('✅ Initial sync completed successfully');
    } else {
      console.warn('⚠️  Initial sync completed with errors:', result.error);
    }
  } catch (error) {
    console.error('❌ Initial sync failed:', error);
  }
}

export default { startScheduledJobs, stopScheduledJobs, runInitialSync };
