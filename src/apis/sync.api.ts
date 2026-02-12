// ============================================
// Sync API (Admin only)
// ============================================

import { fetchWithAuth, handleResponse } from './client';

export const syncApi = {
  async getStatus(): Promise<{
    lastSync: Record<string, unknown> | null;
    aronium: Record<string, unknown>;
  }> {
    const response = await fetchWithAuth('/sync/status');
    const data = await handleResponse<{ data: { lastSync: Record<string, unknown> | null; aronium: Record<string, unknown> } }>(response);
    return data.data;
  },

  async syncAll(): Promise<Record<string, unknown>> {
    const response = await fetchWithAuth('/sync/all', { method: 'POST' });
    const data = await handleResponse<{ data: Record<string, unknown> }>(response);
    return data.data;
  },

  async syncProducts(): Promise<Record<string, unknown>> {
    const response = await fetchWithAuth('/sync/products', { method: 'POST' });
    const data = await handleResponse<{ data: Record<string, unknown> }>(response);
    return data.data;
  },
};
