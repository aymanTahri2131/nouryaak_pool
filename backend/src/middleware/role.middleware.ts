// ============================================
// Role-Based Access Control Middleware
// ============================================

import { Request, Response, NextFunction } from 'express';
import { ApiError } from './error.middleware.js';
import type { UserRole } from '../types/index.js';

// Role hierarchy (higher index = more permissions)
const roleHierarchy: UserRole[] = ['waiter', 'bartender', 'pool_manager', 'admin'];

// Check if user has one of the required roles
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    const userRole = req.user.role;

    // Admin has access to everything
    if (userRole === 'admin') {
      return next();
    }

    // Check if user's role is in allowed roles
    if (allowedRoles.includes(userRole)) {
      return next();
    }

    next(new ApiError(403, `Access denied. Required roles: ${allowedRoles.join(', ')}`));
  };
}

// Check if user has minimum role level
export function requireMinRole(minRole: UserRole) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    const userRoleIndex = roleHierarchy.indexOf(req.user.role);
    const minRoleIndex = roleHierarchy.indexOf(minRole);

    if (userRoleIndex >= minRoleIndex) {
      return next();
    }

    next(new ApiError(403, `Access denied. Minimum role required: ${minRole}`));
  };
}

// Admin only
export function adminOnly(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return next(new ApiError(401, 'Authentication required'));
  }

  if (req.user.role !== 'admin') {
    return next(new ApiError(403, 'Admin access required'));
  }

  next();
}

// Waiter or admin
export function waiterOrAdmin(req: Request, res: Response, next: NextFunction) {
  return requireRole('waiter', 'admin')(req, res, next);
}

// Bartender or admin
export function bartenderOrAdmin(req: Request, res: Response, next: NextFunction) {
  return requireRole('bartender', 'admin')(req, res, next);
}

// Pool manager or admin
export function poolManagerOrAdmin(req: Request, res: Response, next: NextFunction) {
  return requireRole('pool_manager', 'admin')(req, res, next);
}

// Staff (any authenticated user)
export function staffOnly(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return next(new ApiError(401, 'Authentication required'));
  }
  next();
}

export default {
  requireRole,
  requireMinRole,
  adminOnly,
  waiterOrAdmin,
  bartenderOrAdmin,
  poolManagerOrAdmin,
  staffOnly,
};
