// ============================================
// Auth API
// ============================================

import { fetchWithAuth, handleResponse, setTokens, clearTokens } from './client';
import { mapUser } from './mappers';
import type { User } from '@/types';

export const authApi = {
  async login(email: string, password: string): Promise<User> {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL || '/api'}/auth/login`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      }
    );
    const data = await handleResponse<{ data: { user: Record<string, unknown>; accessToken: string; refreshToken: string } }>(response);
    setTokens(data.data.accessToken, data.data.refreshToken);
    return mapUser(data.data.user);
  },

  async pinLogin(pin: string): Promise<User> {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL || '/api'}/auth/pin-login`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      }
    );
    const data = await handleResponse<{ data: { user: Record<string, unknown>; accessToken: string; refreshToken: string } }>(response);
    setTokens(data.data.accessToken, data.data.refreshToken);
    return mapUser(data.data.user);
  },

  async logout(): Promise<void> {
    try {
      await fetchWithAuth('/auth/logout', { method: 'POST' });
    } finally {
      clearTokens();
    }
  },

  async me(): Promise<User> {
    const response = await fetchWithAuth('/auth/me');
    const data = await handleResponse<{ data: { user: Record<string, unknown> } }>(response);
    return mapUser(data.data.user);
  },
};
