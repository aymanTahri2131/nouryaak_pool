// ============================================
// PoolTable Model (aroPos only - not in Aronium)
// ============================================

import mongoose, { Schema, Document, Model } from 'mongoose';
import type { IPoolTable, PoolTableStatus } from '../types/index.js';

export interface IPoolTableDocument extends Omit<IPoolTable, '_id'>, Document { }

export interface IPoolTableModel extends Model<IPoolTableDocument> {
  findByNumber(number: number): Promise<IPoolTableDocument | null>;
  findAvailable(): Promise<IPoolTableDocument[]>;
}

const poolTableSchema = new Schema<IPoolTableDocument>(
  {
    number: {
      type: Number,
      required: [true, 'Pool table number is required'],
      unique: true,
    },
    name: {
      type: String,
      required: [true, 'Pool table name is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['available', 'occupied'],
      default: 'available',
    },
    pricePerPiece: {
      type: Number,
      required: [true, 'Price per piece is required'],
      min: [0, 'Price cannot be negative'],
      default: 1.00,
    },
    currentSessionId: {
      type: Schema.Types.ObjectId,
      ref: 'PoolSession',
      default: null,
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
poolTableSchema.index({ number: 1 });
poolTableSchema.index({ status: 1 });

// Static: find by number
poolTableSchema.statics.findByNumber = function (number: number) {
  return this.findOne({ number });
};

// Static: find available tables
poolTableSchema.statics.findAvailable = function () {
  return this.find({ status: 'available' }).sort({ number: 1 });
};

export const PoolTable = mongoose.model<IPoolTableDocument, IPoolTableModel>('PoolTable', poolTableSchema);
export default PoolTable;
