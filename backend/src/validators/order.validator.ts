// ============================================
// Order Validators (Zod schemas)
// ============================================

import { z } from 'zod';

const orderItemSchema = z.object({
  productId: z.string().min(1, 'Product ID required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  notes: z.string().optional(),
  selectedOptions: z.array(z.string()).optional(),
  sugar: z.number().optional(),
});

export const createOrderSchema = z.object({
  tableId: z.string().min(1, 'Table ID required'),
  items: z.array(orderItemSchema).min(1, 'Order must have at least one item'),
  notes: z.string().optional(),
});

export const addItemsSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'Must add at least one item'),
});

export const updateStatusSchema = z.object({
  status: z.enum(['new', 'preparing', 'ready', 'served', 'paid']),
});

export const orderIdParamSchema = z.object({
  id: z.string().min(1, 'Order ID required'),
});

export const orderQuerySchema = z.object({
  status: z.enum(['new', 'preparing', 'ready', 'served', 'paid']).optional(),
  tableId: z.string().optional(),
  waiterId: z.string().optional(),
  limit: z.string().transform(Number).optional(),
  page: z.string().transform(Number).optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type AddItemsInput = z.infer<typeof addItemsSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
