// ============================================
// Users Routes
// ============================================

import { Router } from 'express';
import * as usersController from '../controllers/users.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { adminOnly } from '../middleware/role.middleware.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.middleware.js';
import * as validators from '../validators/users.validator.js';

const router = Router();

// All routes require authentication and admin role
router.use(authenticateToken, adminOnly);

// GET /api/users - List all users with filtering
router.get(
    '/',
    validateQuery(validators.getUsersQuerySchema),
    usersController.getAllUsers
);

// GET /api/users/:id - Get user by ID
router.get(
    '/:id',
    validateParams(validators.userIdParamSchema),
    usersController.getUserById
);

// POST /api/users - Create new user
router.post(
    '/',
    validateBody(validators.createUserSchema),
    usersController.createUser
);

// PUT /api/users/:id - Update user
router.put(
    '/:id',
    validateParams(validators.userIdParamSchema),
    validateBody(validators.updateUserSchema),
    usersController.updateUser
);

// DELETE /api/users/:id - Soft delete user
router.delete(
    '/:id',
    validateParams(validators.userIdParamSchema),
    usersController.deleteUser
);

export default router;
