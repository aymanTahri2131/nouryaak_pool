import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cafeTablesApi } from '@/apis';
import type { TableStatus } from '@/types';

// Query keys
const CAFE_TABLES_KEYS = {
  all: ['cafeTables'] as const,
  lists: () => [...CAFE_TABLES_KEYS.all, 'list'] as const,
  detail: (id: string) => [...CAFE_TABLES_KEYS.all, 'detail', id] as const,
};

export function useCafeTables() {
  return useQuery({
    queryKey: CAFE_TABLES_KEYS.lists(),
    queryFn: () => cafeTablesApi.getAll(),
  });
}

export function useCafeTablesFree() {
  return useQuery({
    queryKey: ['cafeTables', 'free'],
    queryFn: () => cafeTablesApi.getFree(),
  });
}

export function useCafeTable(tableId: string | null) {
  return useQuery({
    queryKey: ['cafeTables', tableId],
    queryFn: () => cafeTablesApi.getById(tableId!),
    enabled: !!tableId,
  });
}

// Update table status mutation
export function useUpdateTableStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: import('@/types').TableStatus }) =>
      cafeTablesApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CAFE_TABLES_KEYS.lists() });
    },
  });
}

// Create table mutation
export function useCreateTable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { number: number; name: string; capacity?: number }) =>
      cafeTablesApi.createTable(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CAFE_TABLES_KEYS.lists() });
    },
  });
}

// Update table mutation
export function useUpdateTable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { number?: number; name?: string; capacity?: number } }) =>
      cafeTablesApi.updateTable(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: CAFE_TABLES_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: CAFE_TABLES_KEYS.detail(data.id) });
    },
  });
}

// Delete table mutation
export function useDeleteTable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => cafeTablesApi.deleteTable(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CAFE_TABLES_KEYS.lists() });
    },
  });
}

// Pay all orders mutation
export function usePayAllOrders() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tableId: string) => cafeTablesApi.payAll(tableId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CAFE_TABLES_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useAssignWaiter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      tableId,
      waiterId,
      waiterName,
    }: {
      tableId: string;
      waiterId: string;
      waiterName: string;
    }) => cafeTablesApi.assignWaiter(tableId, waiterId, waiterName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cafeTables'] });
    },
  });
}
