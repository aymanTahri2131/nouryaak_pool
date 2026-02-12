// ============================================
// Auth Controller
// ============================================

import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware.js';
import * as authService from '../services/auth.service.js';
import type { 
  LoginInput, 
  PinLoginInput, 
  RegisterInput,
  RefreshTokenInput,
  ChangePasswordInput,
  UpdateProfileInput,
} from '../validators/auth.validator.js';

// POST /api/auth/login
export const login = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as LoginInput;
  const result = await authService.login(input);

  res.json({
    success: true,
    data: {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    },
  });
});

// POST /api/auth/pin-login
export const pinLogin = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as PinLoginInput;
  const result = await authService.pinLogin(input);

  res.json({
    success: true,
    data: {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    },
  });
});

// POST /api/auth/register (admin only)
export const register = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as RegisterInput;
  const user = await authService.register(input);

  res.status(201).json({
    success: true,
    data: { user },
    message: 'User registered successfully',
  });
});

// POST /api/auth/refresh
export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body as RefreshTokenInput;
  const result = await authService.refreshAccessToken(refreshToken);

  res.json({
    success: true,
    data: result,
  });
});

// GET /api/auth/me
export const me = asyncHandler(async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: { user: req.user },
  });
});

// POST /api/auth/logout
export const logout = asyncHandler(async (req: Request, res: Response) => {
  // For JWT, logout is handled client-side by removing the token
  // Could implement token blacklist here if needed
  
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

// PATCH /api/auth/profile
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const updates = req.body as UpdateProfileInput;
  const user = await authService.updateProfile(req.userId!, updates);

  res.json({
    success: true,
    data: { user },
    message: 'Profile updated successfully',
  });
});

// POST /api/auth/change-password
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body as ChangePasswordInput;
  await authService.changePassword(req.userId!, currentPassword, newPassword);

  res.json({
    success: true,
    message: 'Password changed successfully',
  });
});

export default {
  login,
  pinLogin,
  register,
  refresh,
  me,
  logout,
  updateProfile,
  changePassword,
};
