// ============================================
// PoolPlayer Model (leaderboard)
// ============================================

import mongoose, { Schema, Document, Model } from 'mongoose';
import type { IPoolPlayer } from '../types/index.js';

export interface IPoolPlayerDocument extends Omit<IPoolPlayer, '_id'>, Document {
  getWinRate(): number;
}

export interface IPoolPlayerModel extends Model<IPoolPlayerDocument> {
  findByName(name: string): Promise<IPoolPlayerDocument | null>;
  getLeaderboard(limit?: number): Promise<IPoolPlayerDocument[]>;
  updateStats(name: string, won: boolean): Promise<IPoolPlayerDocument | null>;
}

const poolPlayerSchema = new Schema<IPoolPlayerDocument>(
  {
    name: {
      type: String,
      required: [true, 'Player name is required'],
      unique: true,
      trim: true,
    },
    wins: {
      type: Number,
      default: 0,
      min: 0,
    },
    losses: {
      type: Number,
      default: 0,
      min: 0,
    },
    matchesPlayed: {
      type: Number,
      default: 0,
      min: 0,
    },
    avatarUrl: {
      type: String,
      default: 'https://res.cloudinary.com/doq0mdnkz/image/upload/v1772425099/gsekayy2xtsfratohk3q.png',
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

// Virtual: win rate
poolPlayerSchema.virtual('winRate').get(function () {
  if (this.matchesPlayed === 0) return 0;
  return Math.round((this.wins / this.matchesPlayed) * 100);
});

// Indexes
poolPlayerSchema.index({ name: 1 });
poolPlayerSchema.index({ wins: -1 });
poolPlayerSchema.index({ matchesPlayed: -1 });

// Method: get win rate
poolPlayerSchema.methods.getWinRate = function (): number {
  if (this.matchesPlayed === 0) return 0;
  return Math.round((this.wins / this.matchesPlayed) * 100);
};

// Static: find by name (case-insensitive)
poolPlayerSchema.statics.findByName = function (name: string) {
  return this.findOne({ name: new RegExp(`^${name}$`, 'i') });
};

// Static: get leaderboard
poolPlayerSchema.statics.getLeaderboard = function (limit = 10) {
  return this.find({ matchesPlayed: { $gt: 0 } })
    .sort({ wins: -1, matchesPlayed: -1 })
    .limit(limit);
};

// Static: update player stats
poolPlayerSchema.statics.updateStats = async function (
  name: string,
  won: boolean
): Promise<IPoolPlayerDocument | null> {
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return null;
  }

  const update = {
    $inc: {
      matchesPlayed: 1,
      wins: won ? 1 : 0,
      losses: won ? 0 : 1,
    },
    $setOnInsert: { name: name.trim() },
  };

  const player = await this.findOneAndUpdate(
    { name: new RegExp(`^${name.trim()}$`, 'i') },
    update,
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return player;
};

export const PoolPlayer = mongoose.model<IPoolPlayerDocument, IPoolPlayerModel>('PoolPlayer', poolPlayerSchema);
export default PoolPlayer;
