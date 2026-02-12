// ============================================
// Auth Service
// ============================================

import { User, type IUserDocument } from '../models/User.js';
import { generateToken, generateRefreshToken, verifyRefreshToken } from '../middleware/auth.middleware.js';
import { ApiError } from '../middleware/error.middleware.js';
import type { LoginInput, PinLoginInput, RegisterInput } from '../validators/auth.validator.js';

export interface AuthResult {
  user: IUserDocument;
  accessToken: string;
  refreshToken: string;
}

// Login with email and password
export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await User.findByEmail(input.email);

  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const isPasswordValid = await user.comparePassword(input.password);

  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const accessToken = generateToken(user._id.toString(), user.role);
  const refreshToken = generateRefreshToken(user._id.toString());

  return {
    user,
    accessToken,
    refreshToken,
  };
}

// Login with PIN (quick login for staff)
export async function pinLogin(input: PinLoginInput): Promise<AuthResult> {
  const user = await User.findByPin(input.pin);

  if (!user) {
    throw new ApiError(401, 'Invalid PIN');
  }

  const accessToken = generateToken(user._id.toString(), user.role);
  const refreshToken = generateRefreshToken(user._id.toString());

  return {
    user,
    accessToken,
    refreshToken,
  };
}

// Register new user (admin only)
export async function register(input: RegisterInput): Promise<IUserDocument> {
  // Check if email already exists
  const existingUser = await User.findOne({ email: input.email.toLowerCase() });
  if (existingUser) {
    throw new ApiError(409, 'Email already registered');
  }

  // Check if PIN already exists (if provided)
  if (input.pin) {
    const existingPin = await User.findOne({ pin: input.pin });
    if (existingPin) {
      throw new ApiError(409, 'PIN already in use');
    }
  }

  const user = await User.create({
    name: input.name,
    email: input.email.toLowerCase(),
    password: input.password,
    pin: input.pin,
    role: input.role,
  });

  return user;
}

// Refresh access token
export async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
  const decoded = verifyRefreshToken(refreshToken);

  if (!decoded) {
    throw new ApiError(401, 'Invalid refresh token');
  }

  const user = await User.findById(decoded.userId);

  if (!user || !user.isActive) {
    throw new ApiError(401, 'User not found or inactive');
  }

  const accessToken = generateToken(user._id.toString(), user.role);

  return { accessToken };
}

// Get user by ID
export async function getUserById(userId: string): Promise<IUserDocument | null> {
  return User.findById(userId);
}

// Update user profile
export async function updateProfile(
  userId: string,
  updates: { name?: string; email?: string; pin?: string | null }
): Promise<IUserDocument> {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Check email uniqueness
  if (updates.email && updates.email !== user.email) {
    const existing = await User.findOne({ email: updates.email.toLowerCase() });
    if (existing) {
      throw new ApiError(409, 'Email already in use');
    }
    user.email = updates.email.toLowerCase();
  }

  // Check PIN uniqueness
  if (updates.pin !== undefined) {
    if (updates.pin) {
      const existingPin = await User.findOne({ pin: updates.pin, _id: { $ne: userId } });
      if (existingPin) {
        throw new ApiError(409, 'PIN already in use');
      }
      user.pin = updates.pin;
    } else {
      user.pin = undefined;
    }
  }

  if (updates.name) {
    user.name = updates.name;
  }

  await user.save();
  return user;
}

// Change password
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const user = await User.findById(userId).select('+password');

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const isPasswordValid = await user.comparePassword(currentPassword);

  if (!isPasswordValid) {
    throw new ApiError(401, 'Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();
}

export default {
  login,
  pinLogin,
  register,
  refreshAccessToken,
  getUserById,
  updateProfile,
  changePassword,
};
