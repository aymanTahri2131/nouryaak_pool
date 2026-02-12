// ============================================
// Socket Provider - Real-time updates via Socket.io
// ============================================

import { useEffect, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { User } from '@/types';
import {
  connectSocket,
  disconnectSocket,
  joinRole,
  subscribeToOrders,
  subscribeToTableStatus,
  subscribeToPool,
  subscribeToSync,
} from '@/lib/socket';

interface SocketProviderProps {
  children: ReactNode;
  currentUser: User | null;
}

export function SocketProvider({ children, currentUser }: SocketProviderProps) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!currentUser) {
      disconnectSocket();
      return;
    }

    const socket = connectSocket();
    joinRole(currentUser.role);

    const unsubOrders = subscribeToOrders(() => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['cafeTables'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    });

    const unsubTables = subscribeToTableStatus(() => {
      queryClient.invalidateQueries({ queryKey: ['cafeTables'] });
    });

    const unsubPool = subscribeToPool(() => {
      queryClient.invalidateQueries({ queryKey: ['poolTables'] });
      queryClient.invalidateQueries({ queryKey: ['poolLeaderboard'] });
    });

    const unsubSync = subscribeToSync(() => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['cafeTables'] });
    });

    return () => {
      unsubOrders();
      unsubTables();
      unsubPool();
      unsubSync();
      disconnectSocket();
    };
  }, [currentUser, queryClient]);

  return <>{children}</>;
}
