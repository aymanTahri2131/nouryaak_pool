// ============================================
// SyncStatus Model (track Aronium sync)
// ============================================

import mongoose, { Schema, Document, Model } from 'mongoose';
import type { ISyncStatus } from '../types/index.js';

export interface ISyncStatusDocument extends Omit<ISyncStatus, '_id'>, Document { }

export interface ISyncStatusModel extends Model<ISyncStatusDocument> {
  getLatest(type?: string): Promise<ISyncStatusDocument | null>;
  startSync(type: string): Promise<ISyncStatusDocument>;
}

const syncStatusSchema = new Schema<ISyncStatusDocument>(
  {
    type: {
      type: String,
      enum: ['products', 'categories', 'tables', 'full'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'running', 'completed', 'failed'],
      default: 'pending',
    },
    itemsProcessed: {
      type: Number,
      default: 0,
    },
    itemsTotal: {
      type: Number,
      default: 0,
    },
    error: {
      type: String,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
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
syncStatusSchema.index({ type: 1, startedAt: -1 });
syncStatusSchema.index({ status: 1 });

// Static: get latest sync status
syncStatusSchema.statics.getLatest = function (type?: string) {
  const query = type ? { type } : {};
  return this.findOne(query).sort({ startedAt: -1 });
};

// Static: start a new sync
syncStatusSchema.statics.startSync = function (type: string) {
  return this.create({
    type,
    status: 'running',
    startedAt: new Date(),
  });
};

export const SyncStatus = mongoose.model<ISyncStatusDocument, ISyncStatusModel>('SyncStatus', syncStatusSchema);
export default SyncStatus;
