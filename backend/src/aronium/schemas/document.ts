// ============================================
// Aronium Document Schema Queries (for order export)
// ============================================

import { getAroniumDatabase } from '../connection.js';
import { aroniumConfig } from '../../config/aronium.js';
import type { 
  AroniumDocument, 
  AroniumDocumentItem, 
  AroniumDocumentType,
  AroniumWarehouse,
  AroniumCounter,
  AroniumPayment,
  AroniumPaymentType
} from '../../types/aronium.js';

// Get document types
export function getDocumentTypes(): AroniumDocumentType[] {
  const db = getAroniumDatabase();
  if (!db) return [];

  try {
    const stmt = db.prepare(`SELECT * FROM DocumentType ORDER BY Id`);
    return stmt.all() as AroniumDocumentType[];
  } catch (error) {
    console.error('❌ Error fetching document types:', error);
    return [];
  }
}

// Get sales document type (typically used for POS sales)
export function getSalesDocumentType(): AroniumDocumentType | null {
  const db = getAroniumDatabase();
  if (!db) return null;

  try {
    // Look for document type with Code 'SALE' or EditorType = 1 (POS)
    const stmt = db.prepare(`
      SELECT * FROM DocumentType 
      WHERE EditorType = 1 OR Code LIKE '%SALE%' OR Code LIKE '%VENTE%'
      LIMIT 1
    `);
    return stmt.get() as AroniumDocumentType | null;
  } catch (error) {
    console.error('❌ Error fetching sales document type:', error);
    return null;
  }
}

// Get warehouses
export function getWarehouses(): AroniumWarehouse[] {
  const db = getAroniumDatabase();
  if (!db) return [];

  try {
    const stmt = db.prepare(`SELECT * FROM Warehouse ORDER BY Id`);
    return stmt.all() as AroniumWarehouse[];
  } catch (error) {
    console.error('❌ Error fetching warehouses:', error);
    return [];
  }
}

// Get payment types
export function getPaymentTypes(): AroniumPaymentType[] {
  const db = getAroniumDatabase();
  if (!db) return [];

  try {
    const stmt = db.prepare(`SELECT * FROM PaymentType WHERE IsEnabled = 1 ORDER BY Ordinal`);
    return stmt.all() as AroniumPaymentType[];
  } catch (error) {
    console.error('❌ Error fetching payment types:', error);
    return [];
  }
}

// Get next document number
export function getNextDocumentNumber(counterName: string = 'DocumentNumber'): number {
  const db = getAroniumDatabase();
  if (!db) return 1;

  try {
    const stmt = db.prepare(`SELECT Value FROM Counter WHERE Name = ?`);
    const result = stmt.get(counterName) as AroniumCounter | undefined;
    return result ? result.Value + 1 : 1;
  } catch (error) {
    console.error('❌ Error getting next document number:', error);
    return 1;
  }
}

// Insert a document (order) into Aronium - ONLY if export is enabled
export function insertDocument(doc: Partial<AroniumDocument>): number | null {
  const db = getAroniumDatabase();
  if (!db || aroniumConfig.readOnly) {
    console.warn('⚠️  Cannot insert document - database is read-only or not available');
    return null;
  }

  try {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    const stmt = db.prepare(`
      INSERT INTO Document (
        Number, UserId, CustomerId, OrderNumber, Date, StockDate, Total,
        IsClockedOut, DocumentTypeId, WarehouseId, DateCreated, DateUpdated,
        Discount, DiscountType, PaidStatus, DiscountApplyRule, ServiceType
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?
      )
    `);

    const result = stmt.run(
      doc.Number || getNextDocumentNumber().toString(),
      doc.UserId || aroniumConfig.defaults.defaultUserId,
      doc.CustomerId || null,
      doc.OrderNumber || null,
      doc.Date || now,
      doc.StockDate || now,
      doc.Total || 0,
      doc.IsClockedOut || 0,
      doc.DocumentTypeId || aroniumConfig.defaults.documentTypeId,
      doc.WarehouseId || aroniumConfig.defaults.warehouseId,
      now, // DateCreated
      now, // DateUpdated
      doc.Discount || 0,
      doc.DiscountType || 0,
      doc.PaidStatus || 1, // Paid
      doc.DiscountApplyRule || 0,
      doc.ServiceType || 0
    );

    // Update counter
    db.prepare(`UPDATE Counter SET Value = Value + 1 WHERE Name = 'DocumentNumber'`).run();

    console.log(`✅ Inserted document with ID: ${result.lastInsertRowid}`);
    return Number(result.lastInsertRowid);
  } catch (error) {
    console.error('❌ Error inserting document:', error);
    return null;
  }
}

// Insert document item
export function insertDocumentItem(item: Partial<AroniumDocumentItem>): number | null {
  const db = getAroniumDatabase();
  if (!db || aroniumConfig.readOnly) {
    console.warn('⚠️  Cannot insert document item - database is read-only');
    return null;
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO DocumentItem (
        DocumentId, ProductId, Quantity, ExpectedQuantity,
        PriceBeforeTax, Price, Discount, DiscountType,
        ProductCost, PriceBeforeTaxAfterDiscount, PriceAfterDiscount,
        Total, TotalAfterDocumentDiscount, DiscountApplyRule
      ) VALUES (
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?
      )
    `);

    const total = (item.Quantity || 1) * (item.Price || 0);

    const result = stmt.run(
      item.DocumentId,
      item.ProductId,
      item.Quantity || 1,
      item.ExpectedQuantity || 0,
      item.PriceBeforeTax || item.Price || 0,
      item.Price || 0,
      item.Discount || 0,
      item.DiscountType || 0,
      item.ProductCost || 0,
      item.PriceBeforeTaxAfterDiscount || item.Price || 0,
      item.PriceAfterDiscount || item.Price || 0,
      total,
      total,
      item.DiscountApplyRule || 0
    );

    return Number(result.lastInsertRowid);
  } catch (error) {
    console.error('❌ Error inserting document item:', error);
    return null;
  }
}

// Insert payment for document
export function insertPayment(payment: Partial<AroniumPayment>): number | null {
  const db = getAroniumDatabase();
  if (!db || aroniumConfig.readOnly) {
    console.warn('⚠️  Cannot insert payment - database is read-only');
    return null;
  }

  try {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const stmt = db.prepare(`
      INSERT INTO Payment (
        DocumentId, PaymentTypeId, Amount, Date, UserId, DateCreated
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      payment.DocumentId,
      payment.PaymentTypeId || 1, // Default to first payment type (usually cash)
      payment.Amount || 0,
      payment.Date || now,
      payment.UserId || aroniumConfig.defaults.defaultUserId,
      now
    );

    return Number(result.lastInsertRowid);
  } catch (error) {
    console.error('❌ Error inserting payment:', error);
    return null;
  }
}

export default {
  getDocumentTypes,
  getSalesDocumentType,
  getWarehouses,
  getPaymentTypes,
  getNextDocumentNumber,
  insertDocument,
  insertDocumentItem,
  insertPayment,
};
