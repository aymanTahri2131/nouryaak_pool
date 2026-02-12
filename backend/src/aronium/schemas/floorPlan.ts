// ============================================
// Aronium FloorPlan/Table Schema Queries
// ============================================

import { getAroniumDatabase } from '../connection.js';
import type { AroniumFloorPlan, AroniumFloorPlanTable } from '../../types/aronium.js';

// Get all floor plans
export function getAllFloorPlans(): AroniumFloorPlan[] {
  const db = getAroniumDatabase();
  if (!db) return [];

  try {
    const stmt = db.prepare(`
      SELECT Id, Name, Color
      FROM FloorPlan
      ORDER BY Id
    `);
    
    return stmt.all() as AroniumFloorPlan[];
  } catch (error) {
    console.error('❌ Error fetching Aronium floor plans:', error);
    return [];
  }
}

// Get floor plan by ID
export function getFloorPlanById(id: number): AroniumFloorPlan | null {
  const db = getAroniumDatabase();
  if (!db) return null;

  try {
    const stmt = db.prepare(`SELECT * FROM FloorPlan WHERE Id = ?`);
    return stmt.get(id) as AroniumFloorPlan | null;
  } catch (error) {
    console.error(`❌ Error fetching floor plan ${id}:`, error);
    return null;
  }
}

// Get all tables from all floor plans
export function getAllTables(): AroniumFloorPlanTable[] {
  const db = getAroniumDatabase();
  if (!db) return [];

  try {
    const stmt = db.prepare(`
      SELECT Id, Name, FloorPlanId, PositionX, PositionY, Width, Height, IsRound
      FROM FloorPlanTable
      ORDER BY FloorPlanId, Name
    `);
    
    return stmt.all() as AroniumFloorPlanTable[];
  } catch (error) {
    console.error('❌ Error fetching Aronium tables:', error);
    return [];
  }
}

// Get tables for a specific floor plan
export function getTablesByFloorPlan(floorPlanId: number): AroniumFloorPlanTable[] {
  const db = getAroniumDatabase();
  if (!db) return [];

  try {
    const stmt = db.prepare(`
      SELECT * FROM FloorPlanTable
      WHERE FloorPlanId = ?
      ORDER BY Name
    `);
    return stmt.all(floorPlanId) as AroniumFloorPlanTable[];
  } catch (error) {
    console.error(`❌ Error fetching tables for floor plan ${floorPlanId}:`, error);
    return [];
  }
}

// Get table by ID
export function getTableById(id: number): AroniumFloorPlanTable | null {
  const db = getAroniumDatabase();
  if (!db) return null;

  try {
    const stmt = db.prepare(`SELECT * FROM FloorPlanTable WHERE Id = ?`);
    return stmt.get(id) as AroniumFloorPlanTable | null;
  } catch (error) {
    console.error(`❌ Error fetching table ${id}:`, error);
    return null;
  }
}

// Get tables count
export function getTablesCount(): number {
  const db = getAroniumDatabase();
  if (!db) return 0;

  try {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM FloorPlanTable');
    const result = stmt.get() as { count: number };
    return result.count;
  } catch (error) {
    console.error('❌ Error counting tables:', error);
    return 0;
  }
}

export default {
  getAllFloorPlans,
  getFloorPlanById,
  getAllTables,
  getTablesByFloorPlan,
  getTableById,
  getTablesCount,
};
