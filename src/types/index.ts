// Café & Pool Management System Types

// User and Authentication
export type UserRole = 'admin' | 'waiter' | 'bartender' | 'pool_manager';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  avatar?: string;
  pin?: string;
}

// Product Management
export interface Category {
  id: string;
  name: string;
  nameEn: string;
  nameFr: string;
  nameAr?: string;
  icon?: string;
  description?: string;
  order: number;
}

export interface Product {
  id: string;
  name: string;
  nameEn: string;
  nameFr: string;
  nameAr?: string;
  categoryId: string;
  price: number;
  isAvailable: boolean;
  image?: string;
  description?: string;
  hasSugar?: boolean;
  options?: string[];
}

// Order Management
export type OrderStatus = 'new' | 'preparing' | 'ready' | 'served' | 'paid';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
  selectedOptions?: string[];
  sugar?: number;
}

export interface Order {
  id: string;
  orderNumber?: string;
  tableId: string | { id: string; number: number; name?: string };
  items: OrderItem[];
  status: OrderStatus;
  waiterId: string;
  waiterName: string;
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
  total: number;
  isArchived?: boolean;
}

// Café Table Management
export type TableStatus = 'free' | 'ordered' | 'preparing' | 'ready' | 'served' | 'paid';

export interface CafeTable {
  id: string;
  number: number;
  name: string;
  capacity: number;
  status: TableStatus;
  currentOrder?: Order;
  waiterId?: string;
  waiterName?: string;
  hasUnpaidOrders?: boolean;
}

// Pool Table Management
export type PoolTableStatus = 'available' | 'occupied';
export type PoolSessionType = 'pieces' | 'challenge';

export interface PoolPiece {
  id: string;
  count: number;
  playerName?: string;
  addedAt: Date;
}

export interface PoolChallenge {
  id: string;
  mode: 3 | 5 | 7;
  player1Name: string;
  player2Name: string;
  player1Score: number;
  player2Score: number;
  winnerId?: 1 | 2;
  winnerName?: string;
  pricePerGame: number;
}

export interface PoolSession {
  id: string;
  tableId: string;
  type: PoolSessionType;
  pieces?: PoolPiece[];
  challenge?: PoolChallenge;
  startedAt: Date;
  endedAt?: Date;
  totalCost: number;
  isPaid: boolean;
  tournamentId?: string;
  matchId?: string;
}

// Tournament Management
export type TournamentStatus = 'draft' | 'pending' | 'in_progress' | 'completed';

export interface TournamentMatch {
  id: string;
  round: number;
  player1Name?: string;
  player2Name?: string;
  player1Score?: number;
  player2Score?: number;
  winnerName?: string;
  tableId?: string;
  sessionId?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'bye';
  nextMatchId?: string;
  nextMatchSlot?: number;
  label?: string;
  side?: 'left' | 'right' | 'center';
}

export interface PoolTournament {
  id: string;
  name: string;
  status: TournamentStatus;
  players: string[];
  tableIds: string[];
  matches: TournamentMatch[];
  winnerName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PoolTable {
  id: string;
  number: number;
  name: string;
  status: PoolTableStatus;
  currentSession?: PoolSession;
  pricePerPiece: number;
}

// Pool Winners/Leaderboard
export interface PoolPlayer {
  id: string;
  name: string;
  wins: number;
  losses: number;
  matchesPlayed: number;
}

// Statistics
export interface DailyStats {
  date: Date;
  totalRevenue: number;
  cafeRevenue: number;
  poolRevenue: number;
  ordersCount: number;
  poolSessionsCount: number;
  popularProducts: { productId: string; productName: string; count: number }[];
}

// App Language
export type Language = 'en' | 'fr' | 'ar';
