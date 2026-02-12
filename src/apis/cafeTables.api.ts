// ============================================
// Cafe Tables API
// ============================================

import { fetchWithAuth, handleResponse } from './client';
import { mapCafeTable, mapOrder } from './mappers';
import type { CafeTable, TableStatus } from '@/types';

export const cafeTablesApi = {
  async getAll(): Promise<CafeTable[]> {
    const response = await fetchWithAuth('/cafe-tables');
    const data = await handleResponse<{ data: { tables: Record<string, unknown>[] } }>(response);
    return (data.data.tables || []).map((t) => mapCafeTable(t));
  },

  async getFree(): Promise<CafeTable[]> {
    const response = await fetchWithAuth('/cafe-tables/free');
    const data = await handleResponse<{ data: { tables: Record<string, unknown>[] } }>(response);
    return (data.data.tables || []).map((t) => mapCafeTable(t));
  },

  async getById(tableId: string): Promise<{ table: CafeTable; order: import('@/types').Order | null }> {
    const response = await fetchWithAuth(`/cafe-tables/${tableId}`);
    const data = await handleResponse<{ data: { table: Record<string, unknown>; order: Record<string, unknown> | null } }>(response);
    const table = mapCafeTable(data.data.table, data.data.order ?? undefined);
    const order = data.data.order ? mapOrder(data.data.order) : null;
    return { table, order };
  },

  async updateStatus(tableId: string, status: TableStatus): Promise<CafeTable> {
    const response = await fetchWithAuth(`/cafe-tables/${tableId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    const data = await handleResponse<{ data: { table: Record<string, unknown> } }>(response);
    return mapCafeTable(data.data.table);
  },

  async assignWaiter(tableId: string, waiterId: string, waiterName: string): Promise<CafeTable> {
    const response = await fetchWithAuth(`/cafe-tables/${tableId}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ waiterId, waiterName }),
    });
    const data = await handleResponse<{ data: { table: Record<string, unknown> } }>(response);
    return mapCafeTable(data.data.table);
  },

  async payAll(tableId: string): Promise<void> {
    const response = await fetchWithAuth(`/cafe-tables/${tableId}/pay-all`, {
      method: 'POST',
    });
    await handleResponse(response);
  },

  async createTable(data: { number: number; name: string; capacity?: number }): Promise<CafeTable> {
    const response = await fetchWithAuth('/cafe-tables', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const responseData = await handleResponse<{ data: { table: Record<string, unknown> } }>(response);
    return mapCafeTable(responseData.data.table);
  },

  async updateTable(id: string, data: { number?: number; name?: string; capacity?: number }): Promise<CafeTable> {
    const response = await fetchWithAuth(`/cafe-tables/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    const responseData = await handleResponse<{ data: { table: Record<string, unknown> } }>(response);
    return mapCafeTable(responseData.data.table);
  },

  async deleteTable(id: string): Promise<void> {
    const response = await fetchWithAuth(`/cafe-tables/${id}`, {
      method: 'DELETE',
    });
    await handleResponse(response);
  },
};
