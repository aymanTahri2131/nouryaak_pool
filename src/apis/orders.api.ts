// ============================================
// Orders API
// ============================================

import { fetchWithAuth, handleResponse } from './client';
import { mapOrder } from './mappers';
import type { Order } from '@/types';

export const ordersApi = {
  async getActive(): Promise<Order[]> {
    const response = await fetchWithAuth('/orders/active');
    const data = await handleResponse<{ data: { orders: Record<string, unknown>[] } }>(response);
    return (data.data.orders || []).map(mapOrder);
  },

  async getByStatus(status: string): Promise<Order[]> {
    const response = await fetchWithAuth(`/orders?status=${status}`);
    const data = await handleResponse<{ data: { orders: Record<string, unknown>[] } }>(response);
    return (data.data.orders || []).map(mapOrder);
  },

  async getByTable(tableId: string): Promise<Order[]> {
    const response = await fetchWithAuth(`/orders?tableId=${tableId}`);
    const data = await handleResponse<{ data: { orders: Record<string, unknown>[] } }>(response);
    return (data.data.orders || []).map(mapOrder);
  },

  async create(
    tableId: string,
    items: { productId: string; quantity: number; notes?: string; selectedOptions?: string[]; sugar?: number }[],
    notes?: string
  ): Promise<Order> {
    const response = await fetchWithAuth('/orders', {
      method: 'POST',
      body: JSON.stringify({ tableId, items, notes }),
    });
    const data = await handleResponse<{ data: { order: Record<string, unknown> } }>(response);
    return mapOrder(data.data.order);
  },

  async updateStatus(orderId: string, status: Order['status']): Promise<Order> {
    const response = await fetchWithAuth(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    const data = await handleResponse<{ data: { order: Record<string, unknown> } }>(response);
    return mapOrder(data.data.order);
  },

  async addItems(
    orderId: string,
    items: { productId: string; quantity: number; notes?: string; selectedOptions?: string[]; sugar?: number }[]
  ): Promise<Order> {
    const response = await fetchWithAuth(`/orders/${orderId}/items`, {
      method: 'POST',
      body: JSON.stringify({ items }),
    });
    const data = await handleResponse<{ data: { order: Record<string, unknown> } }>(response);
    return mapOrder(data.data.order);
  },

  async getToday(): Promise<Order[]> {
    const response = await fetchWithAuth('/orders/today');
    const data = await handleResponse<{ data: { orders: Record<string, unknown>[] } }>(response);
    return (data.data.orders || []).map(mapOrder);
  },

  async getStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    revenue: number;
  }> {
    const response = await fetchWithAuth('/orders/stats');
    const data = await handleResponse<{ data: { stats: Record<string, unknown> } }>(response);
    return data.data.stats as { total: number; byStatus: Record<string, number>; revenue: number };
  },

  async getHistory(filters: {
    startDate: string;
    endDate: string;
    waiterId?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    orders: Order[];
    totalPages: number;
    currentPage: number;
    total: number;
  }> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') params.set(key, value.toString());
    });

    const response = await fetchWithAuth(`/orders/history?${params}`);
    const data = await handleResponse<{ data: any }>(response);

    return {
      orders: (data.data.orders || []).map(mapOrder),
      totalPages: data.data.totalPages || 0,
      currentPage: data.data.currentPage || 1,
      total: data.data.total || 0,
    };
  },

  async cancelOrder(orderId: string): Promise<void> {
    const response = await fetchWithAuth(`/orders/${orderId}`, {
      method: 'DELETE',
    });
    await handleResponse(response);
  },

  async archiveOrder(orderId: string): Promise<void> {
    const response = await fetchWithAuth(`/orders/${orderId}/archive`, {
      method: 'POST',
    });
    await handleResponse(response);
  },
};
