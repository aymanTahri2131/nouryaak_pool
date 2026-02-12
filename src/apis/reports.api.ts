// ============================================
// Reports API
// ============================================

import { fetchWithAuth, handleResponse } from './client';

export interface ReportStats {
    period: string;
    startDate: string;
    endDate: string;
    cafe: {
        revenue: number;
        orderCount: number;
        avgOrderValue: number;
    };
    pool: {
        revenue: number;
        sessionCount: number;
        avgSessionValue: number;
        metrics: {
            piecesCount: number;
            challengeCount: number;
        };
    };
    totalRevenue: number;
}

export interface PopularProduct {
    _id: string;
    name: string;
    count: number;
    revenue: number;
}

export interface ReportsResponse {
    stats: ReportStats;
    popularProducts: PopularProduct[];
}

export const reportsApi = {
    async getStats(range: 'daily' | 'weekly' | 'monthly', startDate?: string, endDate?: string): Promise<ReportsResponse> {
        let url = `/reports/stats?range=${range}`;
        if (startDate && endDate) {
            url += `&startDate=${startDate}&endDate=${endDate}`;
        }
        const response = await fetchWithAuth(url);
        const data = await handleResponse<{ data: ReportsResponse }>(response);
        return data.data;
    },
};
