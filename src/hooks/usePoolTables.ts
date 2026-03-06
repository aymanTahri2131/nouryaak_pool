import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { poolTablesApi, playersApi } from '@/apis';

export function usePoolTables() {
  return useQuery({
    queryKey: ['poolTables'],
    queryFn: () => poolTablesApi.getAll(),
  });
}

export function useSearchPlayers(query: string) {
  return useQuery({
    queryKey: ['players', 'search', query],
    queryFn: () => playersApi.search(query),
    enabled: query.length >= 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function usePoolLeaderboard(limit = 10) {
  return useQuery({
    queryKey: ['poolLeaderboard', limit],
    queryFn: () => poolTablesApi.getLeaderboard(limit),
  });
}

export function useChallengeHistory(filters: {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ['challengeHistory', filters],
    queryFn: () => poolTablesApi.getChallengeHistory(filters),
  });
}

export function usePiecesHistory(filters: {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ['piecesHistory', filters],
    queryFn: () => poolTablesApi.getPiecesHistory(filters),
  });
}

export function useTournamentHistory(filters: {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ['tournamentHistory', filters],
    queryFn: () => poolTablesApi.getTournamentHistory(filters),
  });
}

export function useStartPiecesSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      tableId,
      pieces,
      playerName,
    }: {
      tableId: string;
      pieces: number;
      playerName?: string;
    }) => poolTablesApi.startPiecesSession(tableId, pieces, playerName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['poolTables'] });
    },
  });
}

export function useStartChallengeSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      tableId,
      mode,
      player1Name,
      player2Name,
      pricePerGame,
    }: {
      tableId: string;
      mode: 3 | 5 | 6 | 7 | 9;
      player1Name: string;
      player2Name: string;
      pricePerGame?: number;
    }) =>
      poolTablesApi.startChallengeSession(tableId, mode, player1Name, player2Name, pricePerGame),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['poolTables'] });
    },
  });
}

export function useAddPieces() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      tableId,
      pieces,
      playerName,
    }: {
      tableId: string;
      pieces: number;
      playerName?: string;
    }) => poolTablesApi.addPieces(tableId, pieces, playerName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['poolTables'] });
    },
  });
}

export function useUpdateChallenge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      tableId,
      player1Score,
      player2Score,
      winnerId,
    }: {
      tableId: string;
      player1Score?: number;
      player2Score?: number;
      winnerId?: 1 | 2;
    }) => poolTablesApi.updateChallenge(tableId, player1Score, player2Score, winnerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['poolTables'] });
    },
  });
}

export function useEndPoolSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      tableId,
      results,
    }: {
      tableId: string;
      results?: Parameters<typeof poolTablesApi.endSession>[1];
    }) => poolTablesApi.endSession(tableId, results),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['poolTables'] });
      queryClient.invalidateQueries({ queryKey: ['unpaidSessions'] });
    },
  });
}

export function useUnpaidSessions() {
  return useQuery({
    queryKey: ['unpaidSessions'],
    queryFn: () => poolTablesApi.getUnpaidSessions(),
    refetchInterval: 1000 * 30, // Refetch every 30 seconds
  });
}

export function useMarkAsPaid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => poolTablesApi.markAsPaid(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unpaidSessions'] });
      queryClient.invalidateQueries({ queryKey: ['poolLeaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['challengeHistory'] });
    },
  });
}

export function useCreatePoolTable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof poolTablesApi.create>[0]) => poolTablesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['poolTables'] });
    },
  });
}

export function useUpdatePoolTable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof poolTablesApi.update>[1] }) =>
      poolTablesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['poolTables'] });
    },
  });
}

export function useDeletePoolTable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => poolTablesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['poolTables'] });
    },
  });
}

export function useCreatePlayer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof playersApi.create>[0]) => playersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
    },
  });
}
