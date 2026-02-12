// ============================================
// Category Model (synced from Aronium ProductGroup)
// ============================================

import mongoose, { Schema, Document, Model } from 'mongoose';
import type { ICategory } from '../types/index.js';

export interface ICategoryDocument extends Omit<ICategory, '_id'>, Document { }

export interface ICategoryModel extends Model<ICategoryDocument> {
  findByAroniumId(aroniumId: number): Promise<ICategoryDocument | null>;
}

const categorySchema = new Schema<ICategoryDocument>(
  {
    aroniumId: {
      type: Number,
      required: false,
      unique: true,
      sparse: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
    },
    nameEn: {
      type: String,
      trim: true,
    },
    nameFr: {
      type: String,
      trim: true,
    },
    nameAr: {
      type: String,
      trim: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    color: {
      type: String,
      default: 'Transparent',
    },
    order: {
      type: Number,
      default: 0,
    },
    lastSyncedAt: {
      type: Date,
      default: Date.now,
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
categorySchema.index({ parentId: 1 });
categorySchema.index({ order: 1 });

// Static method to find category by Aronium ID
categorySchema.statics.findByAroniumId = function (aroniumId: number) {
  return this.findOne({ aroniumId });
};

export const Category = mongoose.model<ICategoryDocument, ICategoryModel>('Category', categorySchema);
export default Category;
