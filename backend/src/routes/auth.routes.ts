// ============================================
// Auth Routes
// ============================================

import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticateToken, adminOnly } from '../middleware/index.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { 
  loginSchema, 
  pinLoginSchema, 
  registerSchema, 
  refreshTokenSchema,
  changePasswordSchema,
  updateProfileSchema,
} from '../validators/auth.validator.js';

const router = Router();

// Public routes
router.post('/login', validateBody(loginSchema), authController.login);
router.post('/pin-login', validateBody(pinLoginSchema), authController.pinLogin);
router.post('/refresh', validateBody(refreshTokenSchema), authController.refresh);

// Protected routes
router.get('/me', authenticateToken, authController.me);
router.post('/logout', authenticateToken, authController.logout);
router.patch('/profile', authenticateToken, validateBody(updateProfileSchema), authController.updateProfile);
router.post('/change-password', authenticateToken, validateBody(changePasswordSchema), authController.changePassword);

// Admin only
router.post('/register', authenticateToken, adminOnly, validateBody(registerSchema), authController.register);

export default router;
