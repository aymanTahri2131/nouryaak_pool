// ============================================
// Tournaments API
// ============================================

import { fetchWithAuth, handleResponse } from './client';
import type { PoolTournament } from '@/types';

export const tournamentsApi = {
    async getAll(): Promise<PoolTournament[]> {
        const response = await fetchWithAuth('/pool-tournaments');
        const data = await handleResponse<{ data: { tournaments: any[] } }>(response);
        return data.data.tournaments.map(t => ({
            ...t,
            id: t._id,
        }));
    },

    async getById(id: string): Promise<PoolTournament> {
        const response = await fetchWithAuth(`/pool-tournaments/${id}`);
        const data = await handleResponse<{ data: { tournament: any } }>(response);
        return {
            ...data.data.tournament,
            id: data.data.tournament._id,
        };
    },

    async create(data: { name: string; players: string[]; tableIds: string[]; status?: string }): Promise<PoolTournament> {
        const response = await fetchWithAuth('/pool-tournaments', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        const result = await handleResponse<{ data: { tournament: any } }>(response);
        return {
            ...result.data.tournament,
            id: result.data.tournament._id,
        };
    },

    async update(id: string, data: { name?: string; players?: string[]; tableIds?: string[] }): Promise<PoolTournament> {
        const response = await fetchWithAuth(`/pool-tournaments/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
        const result = await handleResponse<{ data: { tournament: any } }>(response);
        return {
            ...result.data.tournament,
            id: result.data.tournament._id,
        };
    },

    async finalize(id: string): Promise<PoolTournament> {
        const response = await fetchWithAuth(`/pool-tournaments/${id}/finalize`, {
            method: 'POST',
        });
        const result = await handleResponse<{ data: { tournament: any } }>(response);
        return {
            ...result.data.tournament,
            id: result.data.tournament._id,
        };
    },

    async startMatch(tournamentId: string, matchId: string, tableId: string, mode?: number): Promise<PoolTournament> {
        const response = await fetchWithAuth(`/pool-tournaments/${tournamentId}/matches/${matchId}/start`, {
            method: 'POST',
            body: JSON.stringify({ tableId, mode }),
        });
        const result = await handleResponse<{ data: { tournament: any } }>(response);
        return {
            ...result.data.tournament,
            id: result.data.tournament._id,
        };
    },
};
