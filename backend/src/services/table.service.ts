// ============================================
// Table Service (Cafe Tables)
// ============================================

import { CafeTable, type ICafeTableDocument } from '../models/CafeTable.js';
import { Order } from '../models/Order.js';
import { ApiError } from '../middleware/error.middleware.js';
import { broadcast, socketEvents } from '../config/socket.js';
import type { TableStatus } from '../types/index.js';

// Helper to attach hasUnpaidOrders flag
async function attachUnpaidOrdersFlag(
  tables: ICafeTableDocument[],
  userId?: string,
  userRole?: string
): Promise<ICafeTableDocument[]> {
  const tableIds = tables.map(t => t._id);

  // Build query for unpaid orders
  const query: any = {
    tableId: { $in: tableIds },
    status: { $in: ['served', 'ready'] }, // Considered unpaid/active
  };

  // Logic for smart navigation:
  // Regardless of role, if a userId is provided, we only show their archived orders.
  // This prevents one user's archived order from affecting another user's "Free" table view.
  if (userId) {
    query.$or = [
      { isArchived: { $ne: true } },
      { isArchived: true, waiterId: userId }
    ];
  } else {
    // General case: only show non-archived orders
    query.isArchived = { $ne: true };
  }

  const unpaidOrders = await Order.find(query).select('tableId');

  const unpaidTableIds = new Set(unpaidOrders.map(o => o.tableId.toString()));

  return tables.map(table => {
    const tableObj = table.toObject();
    return {
      ...tableObj,
      hasUnpaidOrders: unpaidTableIds.has(table._id.toString())
    } as any;
  });
}

// Get all tables
export async function getAllTables(userId?: string, userRole?: string): Promise<ICafeTableDocument[]> {
  const tables = await CafeTable.find().populate('currentOrderId').sort({ number: 1 });
  return attachUnpaidOrdersFlag(tables, userId, userRole);
}

// Get table by ID
export async function getTableById(
  tableId: string,
  userId?: string,
  userRole?: string
): Promise<ICafeTableDocument | null> {
  const table = await CafeTable.findById(tableId).populate('currentOrderId');
  if (!table) return null;

  // Build query for unpaid orders check
  const query: any = {
    tableId,
    status: { $in: ['served', 'ready'] }
  };

  if (userId) {
    query.$or = [
      { isArchived: { $ne: true } },
      { isArchived: true, waiterId: userId }
    ];
  } else {
    query.isArchived = { $ne: true };
  }

  const unpaidOrder = await Order.findOne(query);

  const tableObj = table.toObject();
  return {
    ...tableObj,
    hasUnpaidOrders: !!unpaidOrder
  } as any;
}

// Get table by number
export async function getTableByNumber(number: number): Promise<ICafeTableDocument | null> {
  const table = await CafeTable.findByNumber(number);
  if (!table) return null;
  return getTableById(table._id.toString());
}

// Get free tables
export async function getFreeTables(userId?: string, userRole?: string): Promise<ICafeTableDocument[]> {
  const tables = await CafeTable.findFree();
  return attachUnpaidOrdersFlag(tables, userId, userRole);
}

// Get tables by status
export async function getTablesByStatus(
  status: TableStatus,
  userId?: string,
  userRole?: string
): Promise<ICafeTableDocument[]> {
  const tables = await CafeTable.find({ status }).sort({ number: 1 });
  return attachUnpaidOrdersFlag(tables, userId, userRole);
}

// Update table status
export async function updateTableStatus(
  tableId: string,
  status: TableStatus
): Promise<ICafeTableDocument> {
  const table = await CafeTable.findById(tableId);
  if (!table) {
    throw new ApiError(404, 'Table not found');
  }

  // If setting to free, clear order and waiter
  if (status === 'free') {
    table.status = 'free';
    table.currentOrderId = undefined;
    table.waiterId = undefined;
    table.waiterName = undefined;
  } else {
    table.status = status;
  }

  await table.save();

  // Broadcast change
  broadcast(socketEvents.TABLE_STATUS_CHANGED, {
    tableId: table._id,
    number: table.number,
    status: table.status,
  });

  return table;
}

// Assign waiter to table
export async function assignWaiter(
  tableId: string,
  waiterId: string,
  waiterName: string
): Promise<ICafeTableDocument> {
  const table = await CafeTable.findById(tableId);
  if (!table) {
    throw new ApiError(404, 'Table not found');
  }

  table.waiterId = waiterId as any;
  table.waiterName = waiterName;
  await table.save();

  // Broadcast change
  broadcast(socketEvents.TABLE_ASSIGNED, {
    tableId: table._id,
    number: table.number,
    waiterId,
    waiterName,
  });

  return table;
}

// Free table (mark as available)
export async function freeTable(tableId: string): Promise<ICafeTableDocument> {
  const table = await CafeTable.findById(tableId);
  if (!table) {
    throw new ApiError(404, 'Table not found');
  }

  table.status = 'free';
  table.currentOrderId = undefined;
  table.waiterId = undefined;
  table.waiterName = undefined;
  await table.save();

  // Broadcast change
  broadcast(socketEvents.TABLE_STATUS_CHANGED, {
    tableId: table._id,
    number: table.number,
    status: 'free',
  });

  return table;
}

// Get table with current order details
export async function getTableWithOrder(
  tableId: string,
  userId?: string,
  userRole?: string
): Promise<{
  table: ICafeTableDocument;
  order: any | null;
}> {
  const table = await getTableById(tableId, userId, userRole);
  if (!table) {
    throw new ApiError(404, 'Table not found');
  }

  let order = null;
  if (table.currentOrderId) {
    order = await Order.findById(table.currentOrderId);
  }

  return { table, order };
}

// Get table statistics
export async function getTableStats(): Promise<{
  total: number;
  free: number;
  occupied: number;
  byStatus: Record<TableStatus, number>;
}> {
  const tables = await CafeTable.find();

  const byStatus: Record<TableStatus, number> = {
    free: 0,
    ordered: 0,
    preparing: 0,
    ready: 0,
    served: 0,
    paid: 0,
  };

  for (const table of tables) {
    byStatus[table.status]++;
  }

  return {
    total: tables.length,
    free: byStatus.free,
    occupied: tables.length - byStatus.free,
    byStatus,
  };
}

// Create new table (admin function)
export async function createTable(data: {
  number: number;
  name: string;
  capacity?: number;
}): Promise<ICafeTableDocument> {
  // Check if table number already exists
  const existing = await CafeTable.findByNumber(data.number);
  if (existing) {
    throw new ApiError(409, `Table ${data.number} already exists`);
  }

  const table = await CafeTable.create({
    number: data.number,
    name: data.name,
    capacity: data.capacity || 4,
    status: 'free',
  });

  return table;
}

// Update table details (admin function)
export async function updateTable(
  tableId: string,
  data: {
    number?: number;
    name?: string;
    capacity?: number;
  }
): Promise<ICafeTableDocument> {
  const table = await CafeTable.findById(tableId);
  if (!table) {
    throw new ApiError(404, 'Table not found');
  }

  if (data.number !== undefined && data.number !== table.number) {
    const existing = await CafeTable.findByNumber(data.number);
    if (existing) {
      throw new ApiError(409, `Table ${data.number} already exists`);
    }
    table.number = data.number;
  }

  if (data.name !== undefined) table.name = data.name;
  if (data.capacity !== undefined) table.capacity = data.capacity;

  await table.save();
  return table;
}

// Pay all served orders for a table
// ... (rest as before until payAllOrders)
// Pay all served orders for a table
export async function payAllOrders(tableId: string): Promise<void> {
  const table = await CafeTable.findById(tableId);
  if (!table) {
    throw new ApiError(404, 'Table not found');
  }

  // Get all active orders for this table directly from DB
  const tableOrders = await Order.find({
    tableId,
    status: { $ne: 'paid' }
  });

  if (tableOrders.length === 0) {
    throw new ApiError(400, 'No active orders to pay');
  }

  // Verify all orders are served
  const allServed = tableOrders.every(o => o.status === 'served');
  if (!allServed) {
    throw new ApiError(400, 'Cannot pay all: some orders are not served yet');
  }

  // Mark all as paid
  const now = new Date();
  await Order.updateMany(
    { _id: { $in: tableOrders.map(o => o._id) } },
    {
      $set: {
        status: 'paid',
        paidAt: now
      }
    }
  );

  // Free result table
  await freeTable(tableId);

  // Broadcast updates
  tableOrders.forEach(order => {
    broadcast(socketEvents.ORDER_PAID, {
      orderId: order._id,
      tableId: tableId,
    });
  });
}

// Delete table (admin function)
export async function deleteTable(tableId: string): Promise<void> {
  const table = await CafeTable.findById(tableId);
  if (!table) {
    throw new ApiError(404, 'Table not found');
  }

  if (table.status !== 'free') {
    throw new ApiError(400, 'Cannot delete table with active order');
  }

  await CafeTable.findByIdAndDelete(tableId);
}

export default {
  getAllTables,
  getTableById,
  getTableByNumber,
  getFreeTables,
  getTablesByStatus,
  updateTableStatus,
  assignWaiter,
  freeTable,
  payAllOrders,
  getTableWithOrder,
  getTableStats,
  createTable,
  updateTable,
  deleteTable,
};
