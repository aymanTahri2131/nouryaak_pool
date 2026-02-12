// ============================================
// Order Model
// ============================================

import mongoose, { Schema, Document, Model } from 'mongoose';
import type { IOrder, IOrderItem, OrderStatus } from '../types/index.js';

// Order Item Sub-schema
const orderItemSchema = new Schema<IOrderItem>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    aroniumProductId: {
      type: Number,
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
    },
    unitPrice: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative'],
    },
    notes: {
      type: String,
      trim: true,
    },
    selectedOptions: {
      type: [String],
      default: [],
    },
    sugar: {
      type: Number,
    },
  },
  { _id: false }
);

export interface IOrderDocument extends Omit<IOrder, '_id'>, Document {
  calculateTotal(): number;
}

export interface IOrderModel extends Model<IOrderDocument> {
  findActive(): Promise<IOrderDocument[]>;
  findByTable(tableId: string): Promise<IOrderDocument[]>;
  generateOrderNumber(): Promise<string>;
}

const orderSchema = new Schema<IOrderDocument>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    tableId: {
      type: Schema.Types.ObjectId,
      ref: 'CafeTable',
      required: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: function (items: IOrderItem[]) {
          return items.length > 0;
        },
        message: 'Order must have at least one item',
      },
    },
    status: {
      type: String,
      enum: ['new', 'preparing', 'ready', 'served', 'paid'],
      default: 'new',
    },
    waiterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    waiterName: {
      type: String,
      required: true,
    },
    total: {
      type: Number,
      required: true,
      min: [0, 'Total cannot be negative'],
    },
    notes: {
      type: String,
      trim: true,
    },
    exportedToAronium: {
      type: Boolean,
      default: false,
    },
    aroniumDocumentId: {
      type: Number,
    },
    paidAt: {
      type: Date,
    },
    isArchived: {
      type: Boolean,
      default: false,
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
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ tableId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ waiterId: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ exportedToAronium: 1 });

// Calculate total method
orderSchema.methods.calculateTotal = function (): number {
  return this.items.reduce(
    (sum: number, item: IOrderItem) => sum + item.quantity * item.unitPrice,
    0
  );
};

// Pre-save: calculate total
orderSchema.pre('save', function (next) {
  if (this.isModified('items')) {
    this.total = this.calculateTotal();
  }
  next();
});

// Static: find active orders (not paid)
orderSchema.statics.findActive = function () {
  return this.find({ status: { $ne: 'paid' } })
    .populate('tableId')
    .populate('waiterId', 'name')
    .sort({ createdAt: -1 });
};

// Static: find orders by table
orderSchema.statics.findByTable = function (tableId: string) {
  return this.find({ tableId })
    .populate('waiterId', 'name')
    .sort({ createdAt: -1 });
};

// Static: generate unique order number
orderSchema.statics.generateOrderNumber = async function (): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

  // Find the last order created today to determine the sequence
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));

  const lastOrder = await this.findOne({
    createdAt: { $gte: startOfDay, $lte: endOfDay },
  })
    .sort({ orderNumber: -1 })
    .select('orderNumber');

  let sequence = 1;
  if (lastOrder && lastOrder.orderNumber) {
    const parts = lastOrder.orderNumber.split('-');
    if (parts.length === 3) {
      const lastSeq = parseInt(parts[2], 10);
      if (!isNaN(lastSeq)) {
        sequence = lastSeq + 1;
      }
    }
  }

  const sequenceStr = String(sequence).padStart(4, '0');
  return `ORD-${dateStr}-${sequenceStr}`;
};

export const Order = mongoose.model<IOrderDocument, IOrderModel>('Order', orderSchema);
export default Order;
