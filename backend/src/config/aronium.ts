// ============================================
// Aronium SQLite Configuration
// ============================================

import { env } from './env.js';

export const aroniumConfig = {
  dbPath: env.ARONIUM_DB_PATH,
  exportEnabled: env.ARONIUM_EXPORT_ENABLED,
  
  // Default values for document export
  defaults: {
    // DocumentTypeId for "Vente" (Sales) - typically 1 in Aronium
    documentTypeId: 1,
    // Default warehouse - typically 1
    warehouseId: 1,
    // Default user ID if not mapped
    defaultUserId: 1,
  },
  
  // Safety options
  readOnly: !env.ARONIUM_EXPORT_ENABLED,
  backupBeforeExport: true,
};

export function isAroniumConfigured(): boolean {
  return !!aroniumConfig.dbPath && aroniumConfig.dbPath.length > 0;
}

export default aroniumConfig;
