// ============================================
// User Management Validators
// ============================================

import { z } from 'zod';

// User roles enum
const userRoleEnum = z.enum(['admin', 'waiter', 'bartender', 'pool_manager']);

// Create user schema (body only)
export const createUserSchema = z.object({
    name: z
        .string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name cannot exceed 100 characters')
        .trim(),
    email: z
        .string()
        .email('Invalid email format')
        .toLowerCase()
        .trim(),
    password: z
        .string()
        .min(6, 'Password must be at least 6 characters'),
    role: userRoleEnum.default('waiter'),
    pin: z
        .string()
        .regex(/^\d{4}$/, 'PIN must be exactly 4 digits')
        .optional(),
    avatar: z.string().url('Avatar must be a valid URL').optional(),
});

// Update user schema (body only)
export const updateUserSchema = z.object({
    name: z
        .string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name cannot exceed 100 characters')
        .trim()
        .optional(),
    email: z
        .string()
        .email('Invalid email format')
        .toLowerCase()
        .trim()
        .optional(),
    password: z
        .string()
        .min(6, 'Password must be at least 6 characters')
        .optional(),
    role: userRoleEnum.optional(),
    pin: z
        .string()
        .regex(/^\d{4}$/, 'PIN must be exactly 4 digits')
        .optional()
        .nullable(),
    avatar: z.string().url('Avatar must be a valid URL').optional().nullable(),
    isActive: z.boolean().optional(),
});

// User ID param schema
export const userIdParamSchema = z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format'),
});

// Query params for listing users
export const getUsersQuerySchema = z.object({
    role: userRoleEnum.optional(),
    isActive: z
        .string()
        .transform((val) => val === 'true')
        .optional(),
    search: z.string().trim().optional(),
    page: z.preprocess(
        (val) => (val === undefined || val === '' ? 1 : Number(val)),
        z.number().int().positive()
    ),
    limit: z.preprocess(
        (val) => (val === undefined || val === '' ? 20 : Number(val)),
        z.number().int().positive().max(100)
    ),
});

// Type exports
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type GetUsersQuery = z.infer<typeof getUsersQuerySchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;
