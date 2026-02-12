// ============================================
// Reports Controller
// ============================================

import { Request, Response } from 'express';
import { asyncHandler, ApiError } from '../middleware/error.middleware.js';
import * as reportService from '../services/report.service.js';

// GET /api/reports/stats
export const getStats = asyncHandler(async (req: Request, res: Response) => {
    const range = (req.query.range as 'daily' | 'weekly' | 'monthly') || 'daily';
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    if (!['daily', 'weekly', 'monthly'].includes(range)) {
        throw new ApiError(400, 'Invalid range. Must be daily, weekly, or monthly');
    }

    const stats = await reportService.getStats(range, req.userId, req.user?.role, startDate, endDate);
    const popularProducts = (req.user?.role === 'pool_manager')
        ? []
        : await reportService.getPopularProducts(stats.startDate, stats.endDate, 5, req.userId, req.user?.role);

    res.json({
        success: true,
        data: {
            stats,
            popularProducts,
        },
    });
});

export default {
    getStats,
};
