// ============================================
// Reports Hooks
// ============================================

import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/apis';

export function useReports(range: 'daily' | 'weekly' | 'monthly', startDate?: string, endDate?: string) {
    return useQuery({
        queryKey: ['reports', range, startDate, endDate],
        queryFn: () => reportsApi.getStats(range, startDate, endDate),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
