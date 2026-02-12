// ============================================
// Users Controller
// ============================================

import { Request, Response } from 'express';
import { asyncHandler, ApiError } from '../middleware/error.middleware.js';
import { User } from '../models/User.js';
import type { CreateUserInput, UpdateUserInput, GetUsersQuery } from '../validators/users.validator.js';

// GET /api/users - Get all users with filtering
export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    const { role, isActive, search, page = 1, limit = 20 } = req.query as any;

    // Build query
    const query: any = {};

    if (role) {
        query.role = role;
    }

    if (isActive !== undefined) {
        query.isActive = isActive;
    }

    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
        ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query
    const [users, total] = await Promise.all([
        User.find(query)
            .select('-password -pin')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        User.countDocuments(query),
    ]);

    res.json({
        success: true,
        data: {
            users,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        },
    });
});

// GET /api/users/:id - Get user by ID
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const user = await User.findById(id).select('-password -pin');

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    res.json({
        success: true,
        data: { user },
    });
});

// POST /api/users - Create new user
export const createUser = asyncHandler(async (req: Request, res: Response) => {
    const input = req.body as CreateUserInput;

    // Check if email already exists
    const existingUser = await User.findOne({ email: input.email });
    if (existingUser) {
        throw new ApiError(400, 'Email already in use');
    }

    // Create user
    const user = await User.create(input);

    // Log action
    console.log(`✅ User created: ${user.email} by admin ${req.user?.email}`);

    res.status(201).json({
        success: true,
        data: { user: user.toJSON() },
        message: 'User created successfully',
    });
});

// PUT /api/users/:id - Update user
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body as UpdateUserInput;

    // Find user
    const user = await User.findById(id);
    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    // Prevent self-modification of critical fields
    if (id === req.userId) {
        if (updates.role !== undefined) {
            throw new ApiError(403, 'You cannot change your own role');
        }
        if (updates.isActive === false) {
            throw new ApiError(403, 'You cannot deactivate your own account');
        }
    }

    // Check email uniqueness if email is being updated
    if (updates.email && updates.email !== user.email) {
        const existingUser = await User.findOne({ email: updates.email });
        if (existingUser) {
            throw new ApiError(400, 'Email already in use');
        }
    }

    // Update fields
    if (updates.name !== undefined) user.name = updates.name;
    if (updates.email !== undefined) user.email = updates.email;
    if (updates.role !== undefined) user.role = updates.role;
    if (updates.isActive !== undefined) user.isActive = updates.isActive;
    if (updates.avatar !== undefined) user.avatar = updates.avatar || undefined;
    if (updates.pin !== undefined) user.pin = updates.pin || undefined;

    // Password update (will be hashed by pre-save hook)
    if (updates.password !== undefined) {
        user.password = updates.password;
    }

    await user.save();

    // Log action
    console.log(`✅ User updated: ${user.email} by admin ${req.user?.email}`);

    res.json({
        success: true,
        data: { user: user.toJSON() },
        message: 'User updated successfully',
    });
});

// DELETE /api/users/:id - Soft delete user
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    // Prevent self-deletion
    if (id === req.userId) {
        throw new ApiError(403, 'You cannot delete your own account');
    }

    // Find and deactivate user
    const user = await User.findById(id);
    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    if (!user.isActive) {
        throw new ApiError(400, 'User is already deactivated');
    }

    user.isActive = false;
    await user.save();

    // Log action
    console.log(`⚠️  User deactivated: ${user.email} by admin ${req.user?.email}`);

    res.json({
        success: true,
        message: 'User deactivated successfully',
    });
});

export default {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
};
