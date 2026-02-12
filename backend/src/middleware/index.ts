// ============================================
// Middleware - Main Export
// ============================================

export { 
  ApiError, 
  errors, 
  notFoundHandler, 
  errorHandler, 
  asyncHandler 
} from './error.middleware.js';

export { 
  authenticateToken, 
  optionalAuth, 
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
} from './auth.middleware.js';

export { 
  requireRole, 
  requireMinRole, 
  adminOnly, 
  waiterOrAdmin,
  bartenderOrAdmin,
  poolManagerOrAdmin,
  staffOnly,
} from './role.middleware.js';

export { 
  validateBody, 
  validateParams, 
  validateQuery, 
  validate 
} from './validate.middleware.js';

export { createSessionMiddleware } from './session.middleware.js';
