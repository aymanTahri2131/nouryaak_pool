// ============================================
// PoolSession Model (aroPos only)
// ============================================

import mongoose, { Schema, Document, Model } from 'mongoose';
import type { IPoolSession, IPoolPiece, IPoolChallenge, PoolSessionType } from '../types/index.js';

// Pool Piece Sub-schema
const poolPieceSchema = new Schema<IPoolPiece>(
  {
    count: {
      type: Number,
      required: true,
      min: [1, 'Piece count must be at least 1'],
    },
    playerName: {
      type: String,
      trim: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

// Pool Challenge Sub-schema
const poolChallengeSchema = new Schema<IPoolChallenge>(
  {
    mode: {
      type: Number,
      enum: [3, 5, 6, 7, 9],
      required: true,
    },
    player1Name: {
      type: String,
      required: true,
      trim: true,
    },
    player2Name: {
      type: String,
      required: true,
      trim: true,
    },
    player1Score: {
      type: Number,
      default: 0,
      min: 0,
    },
    player2Score: {
      type: Number,
      default: 0,
      min: 0,
    },
    winnerId: {
      type: Number,
      enum: [1, 2],
    },
    winnerName: {
      type: String,
      trim: true,
    },
    pricePerGame: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

export interface IPoolSessionDocument extends Omit<IPoolSession, '_id'>, Document {
  calculateTotalCost(pricePerPiece: number): number;
  getTotalPieces(): number;
  getTotalGames(): number;
}

export interface IPoolSessionModel extends Model<IPoolSessionDocument> {
  findActiveByTable(tableId: string): Promise<IPoolSessionDocument | null>;
  findByTable(tableId: string): Promise<IPoolSessionDocument[]>;
}

const poolSessionSchema = new Schema<IPoolSessionDocument>(
  {
    tableId: {
      type: Schema.Types.ObjectId,
      ref: 'PoolTable',
      required: true,
    },
    type: {
      type: String,
      enum: ['pieces', 'challenge'],
      required: true,
    },
    pieces: {
      type: [poolPieceSchema],
      default: undefined,
    },
    challenge: {
      type: poolChallengeSchema,
      default: undefined,
    },
    totalCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    exportedToAronium: {
      type: Boolean,
      default: false,
    },
    aroniumDocumentId: {
      type: Number,
    },
    tournamentId: {
      type: Schema.Types.ObjectId,
      ref: 'PoolTournament',
    },
    matchId: {
      type: String,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

// Indexes
poolSessionSchema.index({ tableId: 1 });
poolSessionSchema.index({ isPaid: 1 });
poolSessionSchema.index({ startedAt: -1 });

// Calculate total cost
poolSessionSchema.methods.calculateTotalCost = function (pricePerPiece: number): number {
  if (this.type === 'pieces' && this.pieces) {
    return this.pieces.reduce((sum: number, piece: IPoolPiece) => sum + piece.count * pricePerPiece, 0);
  } else if (this.type === 'challenge' && this.challenge) {
    const totalGames = this.challenge.player1Score + this.challenge.player2Score;
    return totalGames * this.challenge.pricePerGame;
  }
  return 0;
};

// Get total pieces
poolSessionSchema.methods.getTotalPieces = function (): number {
  if (this.type === 'pieces' && this.pieces) {
    return this.pieces.reduce((sum: number, piece: IPoolPiece) => sum + piece.count, 0);
  }
  return 0;
};

// Get total games
poolSessionSchema.methods.getTotalGames = function (): number {
  if (this.type === 'challenge' && this.challenge) {
    return this.challenge.player1Score + this.challenge.player2Score;
  }
  return 0;
};

// Static: find active session by table
poolSessionSchema.statics.findActiveByTable = function (tableId: string) {
  return this.findOne({
    tableId,
    isPaid: false,
    $or: [{ endedAt: null }, { endedAt: { $exists: false } }],
  });
};

// Static: find all sessions for a table
poolSessionSchema.statics.findByTable = function (tableId: string) {
  return this.find({ tableId }).sort({ startedAt: -1 });
};

export const PoolSession = mongoose.model<IPoolSessionDocument, IPoolSessionModel>('PoolSession', poolSessionSchema);
export default PoolSession;
