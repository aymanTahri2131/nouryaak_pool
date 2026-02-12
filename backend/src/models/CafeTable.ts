// ============================================
// CafeTable Model (synced from Aronium FloorPlanTable)
// ============================================

import mongoose, { Schema, Document, Model } from 'mongoose';
import type { ICafeTable, TableStatus } from '../types/index.js';

export interface ICafeTableDocument extends Omit<ICafeTable, '_id'>, Document { }

export interface ICafeTableModel extends Model<ICafeTableDocument> {
  findByAroniumId(aroniumId: number): Promise<ICafeTableDocument | null>;
  findByNumber(number: number): Promise<ICafeTableDocument | null>;
  findFree(): Promise<ICafeTableDocument[]>;
}

const cafeTableSchema = new Schema<ICafeTableDocument>(
  {
    aroniumId: {
      type: Number,
      unique: true,
      sparse: true, // Allow null values to be non-unique
      index: true,
    },
    number: {
      type: Number,
      required: [true, 'Table number is required'],
      unique: true,
    },
    name: {
      type: String,
      required: [true, 'Table name is required'],
      trim: true,
    },
    capacity: {
      type: Number,
      default: 4,
      min: [1, 'Capacity must be at least 1'],
    },
    status: {
      type: String,
      enum: ['free', 'ordered', 'preparing', 'ready', 'served', 'paid'],
      default: 'free',
    },
    currentOrderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
    waiterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    waiterName: {
      type: String,
    },
    floorPlanId: {
      type: Number,
    },
    positionX: {
      type: Number,
    },
    positionY: {
      type: Number,
    },
    lastSyncedAt: {
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
cafeTableSchema.index({ number: 1 });
cafeTableSchema.index({ status: 1 });
cafeTableSchema.index({ waiterId: 1 });

// Static: find by Aronium ID
cafeTableSchema.statics.findByAroniumId = function (aroniumId: number) {
  return this.findOne({ aroniumId });
};

// Static: find by number
cafeTableSchema.statics.findByNumber = function (number: number) {
  return this.findOne({ number });
};

// Static: find free tables
cafeTableSchema.statics.findFree = function () {
  return this.find({ status: 'free' }).sort({ number: 1 });
};

export const CafeTable = mongoose.model<ICafeTableDocument, ICafeTableModel>('CafeTable', cafeTableSchema);
export default CafeTable;
