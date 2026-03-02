// ============================================
// Tournaments Hooks
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tournamentsApi } from '@/apis';

export function useTournaments() {
    return useQuery({
        queryKey: ['tournaments'],
        queryFn: () => tournamentsApi.getAll(),
    });
}

export function useTournament(id: string) {
    return useQuery({
        queryKey: ['tournament', id],
        queryFn: () => tournamentsApi.getById(id),
        enabled: !!id,
    });
}

export function useCreateTournament() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { name: string; players: string[]; tableIds: string[]; status?: string }) =>
            tournamentsApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tournaments'] });
        },
    });
}

export function useUpdateTournament() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: { name?: string; players?: string[]; tableIds?: string[] } }) =>
            tournamentsApi.update(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['tournaments'] });
            queryClient.invalidateQueries({ queryKey: ['tournament', variables.id] });
        },
    });
}

export function useFinalizeTournament() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => tournamentsApi.finalize(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ['tournaments'] });
            queryClient.invalidateQueries({ queryKey: ['tournament', id] });
        },
    });
}

export function useStartTournamentMatch() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ tournamentId, matchId, tableId, mode }: { tournamentId: string; matchId: string; tableId: string; mode?: number }) =>
            tournamentsApi.startMatch(tournamentId, matchId, tableId, mode),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['tournaments'] });
            queryClient.invalidateQueries({ queryKey: ['tournament', variables.tournamentId] });
            queryClient.invalidateQueries({ queryKey: ['poolTables'] });
        },
    });
}

export function useUpdateTournamentMatchPlayers() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ tournamentId, matchId, data }: { tournamentId: string; matchId: string; data: { player1Name?: string; player2Name?: string } }) =>
            tournamentsApi.updateMatchPlayers(tournamentId, matchId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['tournaments'] });
            queryClient.invalidateQueries({ queryKey: ['tournament', variables.tournamentId] });
        },
    });
}
