import { fetchWithAuth, handleResponse } from './client';

export interface PoolPlayer {
    _id: string;
    id?: string;
    name: string;
    wins: number;
    losses: number;
    matchesPlayed: number;
    winRate: number;
    avatarUrl?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface GetPoolPlayersResponse {
    success: boolean;
    data: {
        players: PoolPlayer[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    };
}

export interface SearchPoolPlayersResponse {
    success: boolean;
    data: {
        players: PoolPlayer[];
    };
}

export interface CreatePoolPlayerInput {
    name: string;
    wins?: number;
    losses?: number;
    matchesPlayed?: number;
    avatarUrl?: string;
}

export interface UpdatePoolPlayerInput {
    name?: string;
    wins?: number;
    losses?: number;
    matchesPlayed?: number;
    avatarUrl?: string;
}

export const playersApi = {
    // Get all players with pagination and search
    getAll: async (params?: { page?: number; limit?: number; search?: string }) => {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.search) queryParams.append('search', params.search);

        const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
        const response = await fetchWithAuth(`/players${queryString}`);
        const data = await handleResponse<GetPoolPlayersResponse>(response);

        // Map _id to id for frontend consistency if needed
        const players = data.data.players.map(p => ({
            ...p,
            id: p._id || p.id,
        }));
        return {
            ...data.data,
            players,
        };
    },

    // Search players
    search: async (query: string) => {
        const response = await fetchWithAuth(`/players/search?q=${encodeURIComponent(query)}`);
        const data = await handleResponse<SearchPoolPlayersResponse>(response);
        return data.data.players;
    },

    // Create a new player
    create: async (data: CreatePoolPlayerInput) => {
        const response = await fetchWithAuth('/players', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        const responseData = await handleResponse<{ success: boolean; data: { player: PoolPlayer } }>(response);
        return responseData.data.player;
    },

    // Update a player
    update: async (id: string, data: UpdatePoolPlayerInput) => {
        const response = await fetchWithAuth(`/players/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
        const responseData = await handleResponse<{ success: boolean; data: { player: PoolPlayer } }>(response);
        return responseData.data.player;
    },

    // Delete a player
    delete: async (id: string) => {
        const response = await fetchWithAuth(`/players/${id}`, {
            method: 'DELETE',
        });
        const data = await handleResponse<{ success: boolean; message: string }>(response);
        return data.success;
    },
};
