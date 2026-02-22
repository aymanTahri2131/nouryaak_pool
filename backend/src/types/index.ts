// ============================================
// aroPos Types - Shared TypeScript definitions
// ============================================

import { Types } from 'mongoose';

// User and Authentication
export type UserRole = 'admin' | 'waiter' | 'bartender' | 'pool_manager';

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  pin?: string;
  role: UserRole;
  isActive: boolean;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Category
export interface ICategory {
  _id: Types.ObjectId;
  aroniumId: number;
  name: string;
  nameEn: string;
  nameFr: string;
  nameAr?: string;
  parentId?: Types.ObjectId;
  color: string;
  order: number;
  lastSyncedAt: Date;
}

// Product
export interface IProduct {
  _id: Types.ObjectId;
  aroniumId?: number;
  name: string;
  nameEn?: string;
  nameFr?: string;
  nameAr?: string;
  code?: string;
  plu?: number;
  categoryId: Types.ObjectId;
  price: number;
  description?: string;
  isAvailable: boolean;
  hasSugar?: boolean;
  options?: string[];
  color: string;
  imageUrl?: string;
  lastSyncedAt: Date;
}

// Order Item (embedded in Order)
export interface IOrderItem {
  productId: Types.ObjectId;
  aroniumProductId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
  selectedOptions?: string[];
  sugar?: number;
}

// Order Status
export type OrderStatus = 'new' | 'preparing' | 'ready' | 'served' | 'paid';

// Order
export interface IOrder {
  _id: Types.ObjectId;
  orderNumber: string;
  tableId: Types.ObjectId;
  items: IOrderItem[];
  status: OrderStatus;
  waiterId: Types.ObjectId;
  waiterName: string;
  total: number;
  notes?: string;
  exportedToAronium: boolean;
  aroniumDocumentId?: number;
  createdAt: Date;
  updatedAt: Date;
  paidAt?: Date;
  isArchived?: boolean;
}

// Cafe Table Status
export type TableStatus = 'free' | 'ordered' | 'preparing' | 'ready' | 'served' | 'paid';

// Cafe Table
export interface ICafeTable {
  _id: Types.ObjectId;
  aroniumId?: number;
  number: number;
  name: string;
  capacity: number;
  status: TableStatus;
  currentOrderId?: Types.ObjectId;
  waiterId?: Types.ObjectId;
  waiterName?: string;
  floorPlanId?: number;
  positionX?: number;
  positionY?: number;
  lastSyncedAt?: Date;
}

// Pool Table Status
export type PoolTableStatus = 'available' | 'occupied';

// Pool Session Type
export type PoolSessionType = 'pieces' | 'challenge';

// Pool Piece
export interface IPoolPiece {
  count: number;
  playerName?: string;
  addedAt: Date;
}

// Pool Challenge
export interface IPoolChallenge {
  mode: 3 | 5 | 6 | 7 | 9;
  player1Name: string;
  player2Name: string;
  player1Score: number;
  player2Score: number;
  winnerId?: 1 | 2;
  winnerName?: string;
  pricePerGame: number;
}

// Pool Session
export interface IPoolSession {
  _id: Types.ObjectId;
  tableId: Types.ObjectId;
  type: PoolSessionType;
  pieces?: IPoolPiece[];
  challenge?: IPoolChallenge;
  totalCost: number;
  isPaid: boolean;
  exportedToAronium: boolean;
  aroniumDocumentId?: number;
  startedAt: Date;
  endedAt?: Date;
  tournamentId?: Types.ObjectId;
  matchId?: string;
}

// Pool Table
export interface IPoolTable {
  _id: Types.ObjectId;
  number: number;
  name: string;
  status: PoolTableStatus;
  pricePerPiece: number;
  currentSessionId?: Types.ObjectId;
}

// Pool Player (leaderboard)
export interface IPoolPlayer {
  _id: Types.ObjectId;
  name: string;
  wins: number;
  losses: number;
  matchesPlayed: number;
}

// Sync Status
export interface ISyncStatus {
  _id: Types.ObjectId;
  type: 'products' | 'categories' | 'tables' | 'full';
  status: 'pending' | 'running' | 'completed' | 'failed';
  itemsProcessed: number;
  itemsTotal: number;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// JWT Payload
export interface JwtPayload {
  userId: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// Express Request extension
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      userId?: string;
    }
  }
}
