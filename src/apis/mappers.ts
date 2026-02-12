// ============================================
// API Response Mappers - Backend format to Frontend types
// ============================================

import type {
  User,
  Category,
  Product,
  Order,
  OrderItem,
  CafeTable,
  PoolTable,
  PoolSession,
  PoolPiece,
  PoolChallenge,
  PoolPlayer,
} from '@/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toId(obj: any): string {
  if (!obj) return '';
  return typeof obj === 'string' ? obj : obj._id?.toString() || obj.id || '';
}

export function mapUser(apiUser: Record<string, unknown>): User {
  return {
    id: toId(apiUser._id),
    name: (apiUser.name as string) || '',
    email: (apiUser.email as string) || '',
    role: (apiUser.role as User['role']) || 'waiter',
    isActive: (apiUser.isActive as boolean) ?? true,
    avatar: apiUser.avatar as string | undefined,
    pin: apiUser.pin as string | undefined,
  };
}

export function mapCategory(apiCategory: Record<string, unknown>): Category {
  return {
    id: toId(apiCategory._id),
    name: (apiCategory.name as string) || '',
    nameEn: (apiCategory.nameEn as string) || (apiCategory.name as string) || '',
    nameFr: (apiCategory.nameFr as string) || (apiCategory.name as string) || '',
    nameAr: apiCategory.nameAr as string | undefined,
    description: (apiCategory.description as string) || '',
    order: (apiCategory.order as number) ?? 0,
  };
}

export function mapProduct(apiProduct: Record<string, unknown>): Product {
  const categoryId = apiProduct.categoryId;
  return {
    id: toId(apiProduct._id),
    name: (apiProduct.name as string) || '',
    nameEn: (apiProduct.nameEn as string) || (apiProduct.name as string) || '',
    nameFr: (apiProduct.nameFr as string) || (apiProduct.name as string) || '',
    nameAr: apiProduct.nameAr as string | undefined,
    categoryId: typeof categoryId === 'object' && categoryId ? toId(categoryId) : (categoryId as string) || '',
    price: (apiProduct.price as number) ?? 0,
    isAvailable: (apiProduct.isAvailable as boolean) ?? true,
    image: apiProduct.imageUrl as string | undefined,
    description: (apiProduct.description as string) || '',
    hasSugar: (apiProduct.hasSugar as boolean) || false,
    options: (apiProduct.options as string[]) || [],
  };
}

export function mapOrderItem(apiItem: Record<string, unknown>, index: number): OrderItem {
  const productId = apiItem.productId;
  return {
    id: (apiItem._id as string) || `${toId(productId)}-${index}`,
    productId: typeof productId === 'object' && productId ? toId(productId) : (productId as string) || '',
    productName: (apiItem.productName as string) || '',
    quantity: (apiItem.quantity as number) ?? 1,
    unitPrice: (apiItem.unitPrice as number) ?? 0,
    notes: apiItem.notes as string | undefined,
    selectedOptions: (apiItem.selectedOptions as string[]) || [],
    sugar: apiItem.sugar as number | undefined,
  };
}

export function mapOrder(apiOrder: Record<string, unknown>): Order {
  const items = (apiOrder.items as Record<string, unknown>[]) || [];
  const tableId = apiOrder.tableId;
  const waiterId = apiOrder.waiterId;

  return {
    id: toId(apiOrder._id),
    orderNumber: apiOrder.orderNumber as string | undefined,
    tableId: typeof tableId === 'object' && tableId && 'number' in tableId
      ? {
        id: toId(tableId),
        number: (tableId as any).number,
        name: (tableId as any).name
      }
      : (typeof tableId === 'object' && tableId ? toId(tableId) : (tableId as string) || ''),
    items: items.map((item, i) => mapOrderItem(item, i)),
    status: (apiOrder.status as Order['status']) || 'new',
    waiterId: typeof waiterId === 'object' && waiterId ? toId(waiterId) : (waiterId as string) || '',
    waiterName: (apiOrder.waiterName as string) || '',
    createdAt: apiOrder.createdAt ? new Date(apiOrder.createdAt as string) : new Date(),
    updatedAt: apiOrder.updatedAt ? new Date(apiOrder.updatedAt as string) : new Date(),
    notes: apiOrder.notes as string | undefined,
    total: (apiOrder.total as number) ?? 0,
    isArchived: (apiOrder.isArchived as boolean) || false,
  };
}

export function mapCafeTable(
  apiTable: Record<string, unknown>,
  currentOrder?: Record<string, unknown> | null
): CafeTable {
  const table: CafeTable = {
    id: toId(apiTable._id),
    number: (apiTable.number as number) ?? 0,
    name: (apiTable.name as string) || `Table ${apiTable.number}`,
    capacity: (apiTable.capacity as number) ?? 4,
    status: (apiTable.status as CafeTable['status']) || 'free',
    waiterId: apiTable.waiterId ? toId(apiTable.waiterId) : undefined,
    waiterName: apiTable.waiterName as string | undefined,
    hasUnpaidOrders: (apiTable.hasUnpaidOrders as boolean) || false,
  };

  if (currentOrder) {
    table.currentOrder = mapOrder(currentOrder);
  } else if (apiTable.currentOrderId) {
    const order = apiTable.currentOrderId as Record<string, unknown>;
    if (order && typeof order === 'object' && order.items) {
      table.currentOrder = mapOrder(order);
    }
  }

  return table;
}

export function mapPoolPiece(apiPiece: Record<string, unknown>, index: number): PoolPiece {
  return {
    id: (apiPiece._id as string) || `piece-${index}`,
    count: (apiPiece.count as number) ?? 1,
    playerName: apiPiece.playerName as string | undefined,
    addedAt: apiPiece.addedAt ? new Date(apiPiece.addedAt as string) : new Date(),
  };
}

export function mapPoolChallenge(apiChallenge: Record<string, unknown>): PoolChallenge {
  return {
    id: (apiChallenge._id as string) || 'challenge-1',
    mode: (apiChallenge.mode as 3 | 5 | 7) ?? 3,
    player1Name: (apiChallenge.player1Name as string) || '',
    player2Name: (apiChallenge.player2Name as string) || '',
    player1Score: (apiChallenge.player1Score as number) ?? 0,
    player2Score: (apiChallenge.player2Score as number) ?? 0,
    winnerId: apiChallenge.winnerId as 1 | 2 | undefined,
    winnerName: apiChallenge.winnerName as string | undefined,
    pricePerGame: (apiChallenge.pricePerGame as number) ?? 1,
  };
}

export function mapPoolSession(apiSession: Record<string, unknown>): PoolSession {
  const pieces = (apiSession.pieces as Record<string, unknown>[]) || [];
  const challenge = apiSession.challenge as Record<string, unknown> | undefined;

  return {
    id: toId(apiSession._id),
    tableId: toId(apiSession.tableId),
    type: (apiSession.type as PoolSession['type']) || 'pieces',
    pieces: pieces.length > 0 ? pieces.map((p, i) => mapPoolPiece(p, i)) : undefined,
    challenge: challenge ? mapPoolChallenge(challenge) : undefined,
    startedAt: apiSession.startedAt ? new Date(apiSession.startedAt as string) : new Date(),
    endedAt: apiSession.endedAt ? new Date(apiSession.endedAt as string) : undefined,
    totalCost: (apiSession.totalCost as number) ?? 0,
    isPaid: (apiSession.isPaid as boolean) ?? false,
  };
}

export function mapPoolTable(apiTable: Record<string, unknown>): PoolTable {
  const currentSession = apiTable.currentSessionId as Record<string, unknown> | undefined;

  return {
    id: toId(apiTable._id),
    name: (apiTable.name as string) || '',
    number: (apiTable.number as number) ?? 0,
    status: (apiTable.status as PoolTable['status']) || 'available',
    pricePerPiece: (apiTable.pricePerPiece as number) ?? 1,
    currentSession: currentSession && typeof currentSession === 'object' ? mapPoolSession(currentSession) : undefined,
  };
}

export function mapPoolPlayer(apiPlayer: Record<string, unknown>): PoolPlayer {
  return {
    id: toId(apiPlayer._id),
    name: (apiPlayer.name as string) || '',
    wins: (apiPlayer.wins as number) ?? 0,
    losses: (apiPlayer.losses as number) ?? 0,
    matchesPlayed: (apiPlayer.matchesPlayed as number) ?? 0,
  };
}
