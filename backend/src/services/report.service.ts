// ============================================
// Report Service
// ============================================

import { Types } from 'mongoose';
import { Order } from '../models/Order.js';
import { PoolSession } from '../models/PoolSession.js';

export interface ReportStats {
    period: string;
    startDate: Date;
    endDate: Date;
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

export async function getStats(
    range: 'daily' | 'weekly' | 'monthly',
    userId?: string,
    role?: string,
    customStartDate?: string,
    customEndDate?: string
): Promise<ReportStats> {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    if (customStartDate && customEndDate) {
        startDate = new Date(customStartDate);
        // Ensure end date includes the full day if it's just a date string,
        // BUT the frontend sends YYYY-MM-DD.
        // We want to make sure we cover the whole day.
        // The frontend logic for OrdersHistory sends specific dates.
        // Let's align with that.
        endDate = new Date(customEndDate);

        // If the custom date is just "YYYY-MM-DD", it defaults to 00:00:00 UTC.
        // We should ensure the start date is 00:00:00 and end date is 23:59:59 OF THAT DAY relative to the input.
        // However, the frontend sends "YYYY-MM-DD" which effectively means "start of that day".
        // The previous logic for Daily was 00:00 to 23:59.

        // If we trust the frontend to send the correct boundary, we might use it directly.
        // But to be safe and consistent with OrdersHistory logic (which also sets 23:59:59 on backend),
        // let's do the same here.

        // Actually, OrdersHistory backend logic does:
        // const end = new Date(endDate as string);
        // end.setHours(23, 59, 59, 999);

        // We should replicate that here.
        endDate.setHours(23, 59, 59, 999);

        // Start date should probably be 00:00:00 if not specified
        // But New date(string) does that usually.

    } else if (range === 'daily') {
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
    } else if (range === 'weekly') {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
        startDate = new Date(now.setDate(diff));
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
    } else if (range === 'monthly') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
    }

    // Café aggregation
    const cafeMatch: any = {
        status: 'paid',
        createdAt: { $gte: startDate, $lte: endDate },
    };

    if (role === 'waiter' && userId) {
        cafeMatch.waiterId = new Types.ObjectId(userId);
    }

    const cafeStats = (role === 'pool_manager')
        ? []
        : await Order.aggregate([
            { $match: cafeMatch },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$total' },
                    count: { $sum: 1 },
                },
            },
        ]);

    // Pool aggregation
    const poolStats = (role === 'waiter' || role === 'bartender')
        ? []
        : await PoolSession.aggregate([
            {
                $match: {
                    isPaid: true,
                    endedAt: { $gte: startDate, $lte: endDate },
                },
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$totalCost' },
                    count: { $sum: 1 },
                    piecesCount: {
                        $sum: { $cond: [{ $eq: ['$type', 'pieces'] }, 1, 0] },
                    },
                    challengeCount: {
                        $sum: { $cond: [{ $eq: ['$type', 'challenge'] }, 1, 0] },
                    },
                },
            },
        ]);

    const cafeData = cafeStats[0] || { totalRevenue: 0, count: 0 };
    const poolData = poolStats[0] || { totalRevenue: 0, count: 0, piecesCount: 0, challengeCount: 0 };

    return {
        period: range,
        startDate,
        endDate,
        cafe: {
            revenue: cafeData.totalRevenue,
            orderCount: cafeData.count,
            avgOrderValue: cafeData.count > 0 ? cafeData.totalRevenue / cafeData.count : 0,
        },
        pool: {
            revenue: poolData.totalRevenue,
            sessionCount: poolData.count,
            avgSessionValue: poolData.count > 0 ? poolData.totalRevenue / poolData.count : 0,
            metrics: {
                piecesCount: poolData.piecesCount,
                challengeCount: poolData.challengeCount,
            },
        },
        totalRevenue: cafeData.totalRevenue + poolData.totalRevenue,
    };
}

export async function getPopularProducts(
    startDate: Date,
    endDate: Date,
    limit = 5,
    userId?: string,
    role?: string
) {
    if (role === 'pool_manager') return [];

    const match: any = {
        status: 'paid',
        createdAt: { $gte: startDate, $lte: endDate },
    };

    if (role === 'waiter' && userId) {
        match.waiterId = new Types.ObjectId(userId);
    }

    return Order.aggregate([
        { $match: match },
        { $unwind: '$items' },
        {
            $group: {
                _id: '$items.productId',
                name: { $first: '$items.productName' },
                count: { $sum: '$items.quantity' },
                revenue: { $sum: { $multiply: ['$items.quantity', '$items.unitPrice'] } },
            },
        },
        { $sort: { count: -1 } },
        { $limit: limit },
    ]);
}

export default {
    getStats,
    getPopularProducts,
};
