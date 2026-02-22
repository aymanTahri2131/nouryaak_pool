// ============================================
// Pool Tables API
// ============================================

import { fetchWithAuth, handleResponse } from './client';
import { mapPoolTable, mapPoolSession, mapPoolPlayer } from './mappers';
import type { PoolTable, PoolSession, PoolPlayer } from '@/types';

export const poolTablesApi = {
  async getAll(): Promise<PoolTable[]> {
    const response = await fetchWithAuth('/pool-tables');
    const data = await handleResponse<{ data: { tables: Record<string, unknown>[] } }>(response);
    return (data.data.tables || []).map((t) => mapPoolTable(t));
  },

  async getAvailable(): Promise<PoolTable[]> {
    const response = await fetchWithAuth('/pool-tables/available');
    const data = await handleResponse<{ data: { tables: Record<string, unknown>[] } }>(response);
    return (data.data.tables || []).map((t) => mapPoolTable(t));
  },

  async startPiecesSession(
    tableId: string,
    pieces: number,
    playerName?: string
  ): Promise<PoolSession> {
    const response = await fetchWithAuth(`/pool-tables/${tableId}/session`, {
      method: 'POST',
      body: JSON.stringify({ type: 'pieces', pieces, playerName }),
    });
    const data = await handleResponse<{ data: { session: Record<string, unknown> } }>(response);
    return mapPoolSession(data.data.session);
  },

  async startChallengeSession(
    tableId: string,
    mode: 3 | 5 | 6 | 7 | 9,
    player1Name: string,
    player2Name: string,
    pricePerGame?: number
  ): Promise<PoolSession> {
    const response = await fetchWithAuth(`/pool-tables/${tableId}/session`, {
      method: 'POST',
      body: JSON.stringify({ type: 'challenge', mode, player1Name, player2Name, pricePerGame }),
    });
    const data = await handleResponse<{ data: { session: Record<string, unknown> } }>(response);
    return mapPoolSession(data.data.session);
  },

  async addPieces(tableId: string, pieces: number, playerName?: string): Promise<PoolSession> {
    const response = await fetchWithAuth(`/pool-tables/${tableId}/session/pieces`, {
      method: 'POST',
      body: JSON.stringify({ pieces, playerName }),
    });
    const data = await handleResponse<{ data: { session: Record<string, unknown> } }>(response);
    return mapPoolSession(data.data.session);
  },

  async updateChallenge(
    tableId: string,
    player1Score?: number,
    player2Score?: number,
    winnerId?: 1 | 2
  ): Promise<PoolSession> {
    const response = await fetchWithAuth(`/pool-tables/${tableId}/session/challenge`, {
      method: 'PATCH',
      body: JSON.stringify({ player1Score, player2Score, winnerId }),
    });
    const data = await handleResponse<{ data: { session: Record<string, unknown> } }>(response);
    return mapPoolSession(data.data.session);
  },

  async endSession(
    tableId: string,
    results?: { player1Score?: number; player2Score?: number; winnerId?: 1 | 2 }
  ): Promise<{ session: PoolSession; table: PoolTable }> {
    const response = await fetchWithAuth(`/pool-tables/${tableId}/session/pay`, {
      method: 'POST',
      body: results ? JSON.stringify(results) : undefined,
    });
    const data = await handleResponse<{ data: { session: Record<string, unknown>; table: Record<string, unknown> } }>(response);
    return {
      session: mapPoolSession(data.data.session),
      table: mapPoolTable(data.data.table),
    };
  },

  async getLeaderboard(limit = 10): Promise<PoolPlayer[]> {
    const response = await fetchWithAuth(`/pool-tables/leaderboard?limit=${limit}`);
    const data = await handleResponse<{ data: { leaderboard: Record<string, unknown>[] } }>(response);
    return (data.data.leaderboard || []).map(mapPoolPlayer);
  },

  async create(data: { number: number; name: string; pricePerPiece: number }): Promise<PoolTable> {
    const response = await fetchWithAuth('/pool-tables', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const result = await handleResponse<{ data: { table: Record<string, unknown> } }>(response);
    return mapPoolTable(result.data.table);
  },

  async update(id: string, data: Partial<{ number: number; name: string; pricePerPiece: number }>): Promise<PoolTable> {
    const response = await fetchWithAuth(`/pool-tables/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    const result = await handleResponse<{ data: { table: Record<string, unknown> } }>(response);
    return mapPoolTable(result.data.table);
  },

  async delete(id: string): Promise<void> {
    const response = await fetchWithAuth(`/pool-tables/${id}`, { method: 'DELETE' });
    await handleResponse(response);
  },

  async getChallengeHistory(filters: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<{
    sessions: PoolSession[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.search) params.append('search', filters.search);

    const response = await fetchWithAuth(`/pool-tables/history/challenges?${params.toString()}`);
    const data = await handleResponse<{
      data: {
        sessions: Record<string, unknown>[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>(response);

    return {
      sessions: (data.data.sessions || []).map(mapPoolSession),
      total: data.data.total,
      page: data.data.page,
      limit: data.data.limit,
      totalPages: data.data.totalPages,
    };
  },

  async getPiecesHistory(filters: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<{
    sessions: PoolSession[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.search) params.append('search', filters.search);

    const response = await fetchWithAuth(`/pool-tables/history/pieces?${params.toString()}`);
    const data = await handleResponse<{
      data: {
        sessions: Record<string, unknown>[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>(response);

    return {
      sessions: (data.data.sessions || []).map(mapPoolSession),
      total: data.data.total,
      page: data.data.page,
      limit: data.data.limit,
      totalPages: data.data.totalPages,
    };
  },

  async getTournamentHistory(filters: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<{
    sessions: PoolSession[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.search) params.append('search', filters.search);

    const response = await fetchWithAuth(`/pool-tables/history/tournaments?${params.toString()}`);
    const data = await handleResponse<{
      data: {
        sessions: Record<string, unknown>[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>(response);

    return {
      sessions: (data.data.sessions || []).map(mapPoolSession),
      total: data.data.total,
      page: data.data.page,
      limit: data.data.limit,
      totalPages: data.data.totalPages,
    };
  },

  async getUnpaidSessions(): Promise<PoolSession[]> {
    const response = await fetchWithAuth('/pool-tables/sessions/unpaid');
    const data = await handleResponse<{ data: { sessions: Record<string, unknown>[] } }>(response);
    return (data.data.sessions || []).map(mapPoolSession);
  },

  async markAsPaid(sessionId: string): Promise<PoolSession> {
    const response = await fetchWithAuth(`/pool-tables/sessions/${sessionId}/pay`, {
      method: 'PATCH',
    });
    const data = await handleResponse<{ data: { session: Record<string, unknown> } }>(response);
    return mapPoolSession(data.data.session);
  },
};
