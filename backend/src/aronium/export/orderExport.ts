// ============================================
// Order Export to Aronium
// ============================================

import { Order, type IOrderDocument } from '../../models/Order.js';
import { PoolSession, type IPoolSessionDocument } from '../../models/PoolSession.js';
import { aroniumConfig } from '../../config/aronium.js';
import { getAroniumDatabase, backupAroniumDatabase } from '../connection.js';
import { 
  insertDocument, 
  insertDocumentItem, 
  insertPayment,
  getNextDocumentNumber,
  getSalesDocumentType,
} from '../schemas/document.js';

export interface ExportResult {
  success: boolean;
  aroniumDocumentId?: number;
  error?: string;
}

// Export a paid order to Aronium
export async function exportOrderToAronium(orderId: string): Promise<ExportResult> {
  // Check if export is enabled
  if (!aroniumConfig.exportEnabled) {
    return {
      success: false,
      error: 'Aronium export is disabled. Set ARONIUM_EXPORT_ENABLED=true to enable.',
    };
  }

  const db = getAroniumDatabase();
  if (!db) {
    return {
      success: false,
      error: 'Aronium database not available',
    };
  }

  try {
    // Get order
    const order = await Order.findById(orderId);
    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    if (order.status !== 'paid') {
      return { success: false, error: 'Order is not paid yet' };
    }

    if (order.exportedToAronium) {
      return { 
        success: true, 
        aroniumDocumentId: order.aroniumDocumentId,
        error: 'Order already exported',
      };
    }

    // Backup database before export
    if (aroniumConfig.backupBeforeExport) {
      backupAroniumDatabase();
    }

    // Get document type
    const docType = getSalesDocumentType();
    const documentTypeId = docType?.Id || aroniumConfig.defaults.documentTypeId;

    // Create document
    const now = new Date().toISOString().slice(0, 10);
    const documentId = insertDocument({
      Number: getNextDocumentNumber().toString(),
      OrderNumber: order.orderNumber,
      Date: now,
      StockDate: now,
      Total: order.total,
      DocumentTypeId: documentTypeId,
      WarehouseId: aroniumConfig.defaults.warehouseId,
      UserId: aroniumConfig.defaults.defaultUserId,
      PaidStatus: 1,
    });

    if (!documentId) {
      return { success: false, error: 'Failed to create Aronium document' };
    }

    // Insert document items
    for (const item of order.items) {
      const itemResult = insertDocumentItem({
        DocumentId: documentId,
        ProductId: item.aroniumProductId,
        Quantity: item.quantity,
        Price: item.unitPrice,
        Total: item.quantity * item.unitPrice,
      });

      if (!itemResult) {
        console.warn(`⚠️  Failed to insert item for product ${item.aroniumProductId}`);
      }
    }

    // Insert payment
    insertPayment({
      DocumentId: documentId,
      Amount: order.total,
      PaymentTypeId: 1, // Cash (default)
      UserId: aroniumConfig.defaults.defaultUserId,
    });

    // Update order with Aronium document ID
    order.exportedToAronium = true;
    order.aroniumDocumentId = documentId;
    await order.save();

    console.log(`✅ Order ${order.orderNumber} exported to Aronium (Document ID: ${documentId})`);

    return {
      success: true,
      aroniumDocumentId: documentId,
    };

  } catch (error) {
    console.error('❌ Failed to export order to Aronium:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Export pool session to Aronium (as a service item)
export async function exportPoolSessionToAronium(sessionId: string): Promise<ExportResult> {
  if (!aroniumConfig.exportEnabled) {
    return {
      success: false,
      error: 'Aronium export is disabled',
    };
  }

  const db = getAroniumDatabase();
  if (!db) {
    return {
      success: false,
      error: 'Aronium database not available',
    };
  }

  try {
    const session = await PoolSession.findById(sessionId);
    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    if (!session.isPaid) {
      return { success: false, error: 'Session is not paid yet' };
    }

    if (session.exportedToAronium) {
      return {
        success: true,
        aroniumDocumentId: session.aroniumDocumentId,
        error: 'Session already exported',
      };
    }

    // Backup before export
    if (aroniumConfig.backupBeforeExport) {
      backupAroniumDatabase();
    }

    // Get document type
    const docType = getSalesDocumentType();
    const documentTypeId = docType?.Id || aroniumConfig.defaults.documentTypeId;

    // Create document
    const now = new Date().toISOString().slice(0, 10);
    const sessionDesc = session.type === 'pieces' 
      ? `Pool - ${session.getTotalPieces()} pieces`
      : `Pool Challenge - ${session.getTotalGames()} games`;

    const documentId = insertDocument({
      Number: getNextDocumentNumber().toString(),
      OrderNumber: `POOL-${session._id.toString().slice(-6)}`,
      Date: now,
      StockDate: now,
      Total: session.totalCost,
      DocumentTypeId: documentTypeId,
      WarehouseId: aroniumConfig.defaults.warehouseId,
      UserId: aroniumConfig.defaults.defaultUserId,
      PaidStatus: 1,
      Note: sessionDesc,
    });

    if (!documentId) {
      return { success: false, error: 'Failed to create Aronium document' };
    }

    // Insert payment
    insertPayment({
      DocumentId: documentId,
      Amount: session.totalCost,
      PaymentTypeId: 1,
      UserId: aroniumConfig.defaults.defaultUserId,
    });

    // Update session
    session.exportedToAronium = true;
    session.aroniumDocumentId = documentId;
    await session.save();

    console.log(`✅ Pool session exported to Aronium (Document ID: ${documentId})`);

    return {
      success: true,
      aroniumDocumentId: documentId,
    };

  } catch (error) {
    console.error('❌ Failed to export pool session to Aronium:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Export all unpaid exports (batch)
export async function exportPendingOrders(): Promise<{
  exported: number;
  failed: number;
  errors: string[];
}> {
  const result = {
    exported: 0,
    failed: 0,
    errors: [] as string[],
  };

  // Find orders that are paid but not exported
  const pendingOrders = await Order.find({
    status: 'paid',
    exportedToAronium: false,
  });

  for (const order of pendingOrders) {
    const exportResult = await exportOrderToAronium(order._id.toString());
    if (exportResult.success) {
      result.exported++;
    } else {
      result.failed++;
      result.errors.push(`Order ${order.orderNumber}: ${exportResult.error}`);
    }
  }

  // Find pool sessions that are paid but not exported
  const pendingSessions = await PoolSession.find({
    isPaid: true,
    exportedToAronium: false,
  });

  for (const session of pendingSessions) {
    const exportResult = await exportPoolSessionToAronium(session._id.toString());
    if (exportResult.success) {
      result.exported++;
    } else {
      result.failed++;
      result.errors.push(`Pool session ${session._id}: ${exportResult.error}`);
    }
  }

  return result;
}

export default {
  exportOrderToAronium,
  exportPoolSessionToAronium,
  exportPendingOrders,
};
