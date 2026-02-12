import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '@/apis';
import type { OrderStatus } from '@/types';

export function useActiveOrders() {
  return useQuery({
    queryKey: ['orders', 'active'],
    queryFn: () => ordersApi.getActive(),
  });
}

export function useOrdersByStatus(status: string) {
  return useQuery({
    queryKey: ['orders', status],
    queryFn: () => ordersApi.getByStatus(status),
    enabled: !!status,
  });
}

export function useTableOrders(tableId: string | null) {
  return useQuery({
    queryKey: ['orders', 'table', tableId],
    queryFn: () => tableId ? ordersApi.getByTable(tableId) : Promise.resolve([]),
    enabled: !!tableId,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      tableId,
      items,
      notes,
    }: {
      tableId: string;
      items: { productId: string; quantity: number; notes?: string; selectedOptions?: string[]; sugar?: number }[];
      notes?: string;
    }) => ordersApi.create(tableId, items, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['cafeTables'] });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
      ordersApi.updateStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['cafeTables'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useAddItemsToOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      items,
    }: {
      orderId: string;
      items: { productId: string; quantity: number; notes?: string; selectedOptions?: string[]; sugar?: number }[];
    }) => ordersApi.addItems(orderId, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

// Cancel order mutation
export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => ordersApi.cancelOrder(orderId),
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['cafeTables'] });
      queryClient.invalidateQueries({ queryKey: ['cafeTable'] }); // Detail view
    },
  });
}

// Archive order mutation
export function useArchiveOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => ordersApi.archiveOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cafeTables'] });
      queryClient.invalidateQueries({ queryKey: ['cafeTable'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] }); // Refresh orders list
    },
  });
}

export function useTodayOrders() {
  return useQuery({
    queryKey: ['orders', 'today'],
    queryFn: () => ordersApi.getToday(),
  });
}

export function useOrderStats() {
  return useQuery({
    queryKey: ['orders', 'stats'],
    queryFn: () => ordersApi.getStats(),
  });
}

export function useOrdersHistory(filters: {
  startDate?: string;
  endDate?: string;
  waiterId?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['orders', 'history', filters],
    queryFn: () => {
      if (!filters.startDate || !filters.endDate) {
        return Promise.resolve({ orders: [], totalPages: 0, currentPage: 1, total: 0 });
      }
      return ordersApi.getHistory({
        startDate: filters.startDate,
        endDate: filters.endDate,
        waiterId: filters.waiterId,
        page: filters.page,
        limit: filters.limit,
      });
    },
    enabled: !!(filters.startDate && filters.endDate),
  });
}
