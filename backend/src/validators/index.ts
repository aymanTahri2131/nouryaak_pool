// ============================================
// Validators - Main Export
// ============================================

export * from './auth.validator.js';
export * from './order.validator.js';
export * from './pool.validator.js';
export * from './users.validator.js';

// Common ID param schema
import { z } from 'zod';

export const idParamSchema = z.object({
  id: z.string().min(1, 'ID required'),
});

export const paginationSchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
});

export type IdParam = z.infer<typeof idParamSchema>;
export type PaginationQuery = z.infer<typeof paginationSchema>;
