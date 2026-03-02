import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { playersApi, CreatePoolPlayerInput, UpdatePoolPlayerInput } from '../apis/poolPlayers.api';

// Query Keys
export const playerKeys = {
    all: ['poolPlayers'] as const,
    lists: () => [...playerKeys.all, 'list'] as const,
    list: (filters: string) => [...playerKeys.lists(), { filters }] as const,
    searches: () => [...playerKeys.all, 'search'] as const,
    search: (query: string) => [...playerKeys.searches(), { query }] as const,
};

// Hooks

export function usePoolPlayers(params?: { page?: number; limit?: number; search?: string }) {
    return useQuery({
        queryKey: playerKeys.list(JSON.stringify(params)),
        queryFn: () => playersApi.getAll(params),
    });
}

export function useSearchPoolPlayers(query: string) {
    return useQuery({
        queryKey: playerKeys.search(query),
        queryFn: () => playersApi.search(query),
        enabled: query.length >= 2,
    });
}

export function useCreatePoolPlayer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreatePoolPlayerInput) => playersApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: playerKeys.lists() });
        },
    });
}

export function useUpdatePoolPlayer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdatePoolPlayerInput }) =>
            playersApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: playerKeys.lists() });
        },
    });
}

export function useDeletePoolPlayer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => playersApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: playerKeys.lists() });
        },
    });
}
