// ============================================
// Product Model (synced from Aronium)
// ============================================

import mongoose, { Schema, Document, Model } from 'mongoose';
import type { IProduct } from '../types/index.js';

export interface IProductDocument extends Omit<IProduct, '_id'>, Document { }

export interface IProductModel extends Model<IProductDocument> {
  findByAroniumId(aroniumId: number): Promise<IProductDocument | null>;
  findAvailable(): Promise<IProductDocument[]>;
}

const productSchema = new Schema<IProductDocument>(
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
      required: [true, 'Product name is required'],
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
    description: {
      type: String,
    },
    code: {
      type: String,
      trim: true,
    },
    plu: {
      type: Number,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    hasSugar: {
      type: Boolean,
      default: false,
    },
    options: {
      type: [String],
      default: [],
    },
    color: {
      type: String,
      default: 'Transparent',
    },
    imageUrl: {
      type: String,
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

// Text index for search
productSchema.index({ name: 'text' });

// Static method to find product by Aronium ID
productSchema.statics.findByAroniumId = function (aroniumId: number) {
  return this.findOne({ aroniumId });
};

// Static method to find available products
productSchema.statics.findAvailable = function () {
  return this.find({ isAvailable: true }).populate('categoryId');
};

export const Product = mongoose.model<IProductDocument, IProductModel>('Product', productSchema);
export default Product;
