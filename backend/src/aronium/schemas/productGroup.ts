// ============================================
// Aronium ProductGroup (Category) Schema Queries
// ============================================

import { getAroniumDatabase } from '../connection.js';
import type { AroniumProductGroup } from '../../types/aronium.js';

// Get all product groups/categories from Aronium
export function getAllProductGroups(): AroniumProductGroup[] {
  const db = getAroniumDatabase();
  if (!db) return [];

  try {
    const stmt = db.prepare(`
      SELECT Id, Name, ParentGroupId, Color, Image, Rank
      FROM ProductGroup
      ORDER BY Rank, Name
    `);
    
    return stmt.all() as AroniumProductGroup[];
  } catch (error) {
    console.error('❌ Error fetching Aronium product groups:', error);
    return [];
  }
}

// Get a single product group by ID
export function getProductGroupById(id: number): AroniumProductGroup | null {
  const db = getAroniumDatabase();
  if (!db) return null;

  try {
    const stmt = db.prepare(`
      SELECT * FROM ProductGroup WHERE Id = ?
    `);
    return stmt.get(id) as AroniumProductGroup | null;
  } catch (error) {
    console.error(`❌ Error fetching Aronium product group ${id}:`, error);
    return null;
  }
}

// Get child groups (sub-categories)
export function getChildGroups(parentId: number): AroniumProductGroup[] {
  const db = getAroniumDatabase();
  if (!db) return [];

  try {
    const stmt = db.prepare(`
      SELECT * FROM ProductGroup
      WHERE ParentGroupId = ?
      ORDER BY Rank, Name
    `);
    return stmt.all(parentId) as AroniumProductGroup[];
  } catch (error) {
    console.error(`❌ Error fetching child groups for ${parentId}:`, error);
    return [];
  }
}

// Get root groups (no parent)
export function getRootGroups(): AroniumProductGroup[] {
  const db = getAroniumDatabase();
  if (!db) return [];

  try {
    const stmt = db.prepare(`
      SELECT * FROM ProductGroup
      WHERE ParentGroupId IS NULL
      ORDER BY Rank, Name
    `);
    return stmt.all() as AroniumProductGroup[];
  } catch (error) {
    console.error('❌ Error fetching root product groups:', error);
    return [];
  }
}

// Get product groups count
export function getProductGroupsCount(): number {
  const db = getAroniumDatabase();
  if (!db) return 0;

  try {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM ProductGroup');
    const result = stmt.get() as { count: number };
    return result.count;
  } catch (error) {
    console.error('❌ Error counting product groups:', error);
    return 0;
  }
}

export default {
  getAllProductGroups,
  getProductGroupById,
  getChildGroups,
  getRootGroups,
  getProductGroupsCount,
};
