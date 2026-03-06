// ============================================
// Players API
// ============================================

import { fetchWithAuth, handleResponse } from './client';
import { mapPoolPlayer } from './mappers';
import type { PoolPlayer } from '@/types';

export const playersApi = {
    async search(query: string): Promise<PoolPlayer[]> {
        const response = await fetchWithAuth(`/players/search?q=${encodeURIComponent(query)}`);
        const data = await handleResponse<{ data: { players: Record<string, unknown>[] } }>(response);
        return (data.data.players || []).map(mapPoolPlayer);
    },

    async getAll(limit = 50): Promise<PoolPlayer[]> {
        const response = await fetchWithAuth(`/players?limit=${limit}`);
        const data = await handleResponse<{ data: { players: Record<string, unknown>[] } }>(response);
        return (data.data.players || []).map(mapPoolPlayer);
    },

    async create(data: { name: string, wins?: number, losses?: number, matchesPlayed?: number, avatarUrl?: string }): Promise<PoolPlayer> {
        const response = await fetchWithAuth('/players', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        const responseData = await handleResponse<{ data: { player: Record<string, unknown> } }>(response);
        return mapPoolPlayer(responseData.data.player);
    },
};
