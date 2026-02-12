// ============================================
// Aronium Product Schema Queries
// ============================================

import { getAroniumDatabase } from '../connection.js';
import type { AroniumProduct, AroniumProductTax } from '../../types/aronium.js';

// Get all enabled products from Aronium
export function getAllProducts(): AroniumProduct[] {
  const db = getAroniumDatabase();
  if (!db) return [];

  try {
    const stmt = db.prepare(`
      SELECT 
        Id, ProductGroupId, Name, Code, PLU, MeasurementUnit,
        Price, IsTaxInclusivePrice, CurrencyId, IsPriceChangeAllowed,
        IsService, IsUsingDefaultQuantity, IsEnabled, Description,
        DateCreated, DateUpdated, Cost, Markup, Image, Color,
        AgeRestriction, LastPurchasePrice, Rank
      FROM Product
      WHERE IsEnabled = 1
      ORDER BY Rank, Name
    `);
    
    return stmt.all() as AroniumProduct[];
  } catch (error) {
    console.error('❌ Error fetching Aronium products:', error);
    return [];
  }
}

// Get a single product by ID
export function getProductById(id: number): AroniumProduct | null {
  const db = getAroniumDatabase();
  if (!db) return null;

  try {
    const stmt = db.prepare(`
      SELECT * FROM Product WHERE Id = ?
    `);
    return stmt.get(id) as AroniumProduct | null;
  } catch (error) {
    console.error(`❌ Error fetching Aronium product ${id}:`, error);
    return null;
  }
}

// Get products by category/group
export function getProductsByGroup(groupId: number): AroniumProduct[] {
  const db = getAroniumDatabase();
  if (!db) return [];

  try {
    const stmt = db.prepare(`
      SELECT * FROM Product
      WHERE ProductGroupId = ? AND IsEnabled = 1
      ORDER BY Rank, Name
    `);
    return stmt.all(groupId) as AroniumProduct[];
  } catch (error) {
    console.error(`❌ Error fetching products for group ${groupId}:`, error);
    return [];
  }
}

// Get product taxes
export function getProductTaxes(productId: number): AroniumProductTax[] {
  const db = getAroniumDatabase();
  if (!db) return [];

  try {
    const stmt = db.prepare(`
      SELECT ProductId, TaxId FROM ProductTax WHERE ProductId = ?
    `);
    return stmt.all(productId) as AroniumProductTax[];
  } catch (error) {
    console.error(`❌ Error fetching taxes for product ${productId}:`, error);
    return [];
  }
}

// Get products count
export function getProductsCount(): number {
  const db = getAroniumDatabase();
  if (!db) return 0;

  try {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM Product WHERE IsEnabled = 1');
    const result = stmt.get() as { count: number };
    return result.count;
  } catch (error) {
    console.error('❌ Error counting products:', error);
    return 0;
  }
}

// Get products updated after a certain date
export function getProductsUpdatedAfter(date: Date): AroniumProduct[] {
  const db = getAroniumDatabase();
  if (!db) return [];

  try {
    const dateStr = date.toISOString().slice(0, 19).replace('T', ' ');
    const stmt = db.prepare(`
      SELECT * FROM Product
      WHERE DateUpdated > ? AND IsEnabled = 1
      ORDER BY DateUpdated DESC
    `);
    return stmt.all(dateStr) as AroniumProduct[];
  } catch (error) {
    console.error('❌ Error fetching updated products:', error);
    return [];
  }
}

export default {
  getAllProducts,
  getProductById,
  getProductsByGroup,
  getProductTaxes,
  getProductsCount,
  getProductsUpdatedAfter,
};
