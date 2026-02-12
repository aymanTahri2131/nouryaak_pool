// ============================================
// Aronium SQLite Connection (better-sqlite3)
// ============================================

import Database, { Database as DatabaseType } from 'better-sqlite3';
import { aroniumConfig, isAroniumConfigured } from '../config/aronium.js';
import fs from 'fs';
import path from 'path';

let db: DatabaseType | null = null;

export function getAroniumDatabase(): DatabaseType | null {
  if (db) return db;
  
  if (!isAroniumConfigured()) {
    console.warn('⚠️  Aronium DB path not configured');
    return null;
  }

  const dbPath = aroniumConfig.dbPath;
  
  // Check if file exists
  if (!fs.existsSync(dbPath)) {
    console.warn(`⚠️  Aronium database not found at: ${dbPath}`);
    return null;
  }

  try {
    console.log(`📂 Opening Aronium database: ${dbPath}`);
    
    db = new Database(dbPath, {
      readonly: aroniumConfig.readOnly,
      fileMustExist: true,
    });

    // Enable foreign keys
    db.pragma('foreign_keys = ON');
    
    console.log(`✅ Aronium database connected (readonly: ${aroniumConfig.readOnly})`);
    return db;
  } catch (error) {
    console.error('❌ Failed to connect to Aronium database:', error);
    return null;
  }
}

export function closeAroniumDatabase(): void {
  if (db) {
    try {
      db.close();
      db = null;
      console.log('📂 Aronium database closed');
    } catch (error) {
      console.error('❌ Error closing Aronium database:', error);
    }
  }
}

export function isAroniumConnected(): boolean {
  return db !== null && db.open;
}

// Backup Aronium database before export operations
export function backupAroniumDatabase(): string | null {
  if (!isAroniumConfigured()) return null;
  
  const dbPath = aroniumConfig.dbPath;
  const backupDir = path.dirname(dbPath);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `pos_backup_${timestamp}.db`);
  
  try {
    fs.copyFileSync(dbPath, backupPath);
    console.log(`💾 Aronium database backed up to: ${backupPath}`);
    return backupPath;
  } catch (error) {
    console.error('❌ Failed to backup Aronium database:', error);
    return null;
  }
}

// Test connection and return basic stats
export function testAroniumConnection(): { 
  connected: boolean; 
  readonly: boolean;
  productCount?: number;
  categoryCount?: number;
  error?: string;
} {
  try {
    const database = getAroniumDatabase();
    
    if (!database) {
      return { 
        connected: false, 
        readonly: true,
        error: 'Database not available' 
      };
    }

    const productCount = database.prepare('SELECT COUNT(*) as count FROM Product').get() as { count: number };
    const categoryCount = database.prepare('SELECT COUNT(*) as count FROM ProductGroup').get() as { count: number };

    return {
      connected: true,
      readonly: aroniumConfig.readOnly,
      productCount: productCount.count,
      categoryCount: categoryCount.count,
    };
  } catch (error) {
    return {
      connected: false,
      readonly: true,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export default {
  getAroniumDatabase,
  closeAroniumDatabase,
  isAroniumConnected,
  backupAroniumDatabase,
  testAroniumConnection,
};
