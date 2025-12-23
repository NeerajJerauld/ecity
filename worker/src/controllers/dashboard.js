import { jsonResponse, errorResponse } from '../utils/response.js';

export class DashboardController {
    static async getStats(request, env, user) {
        try {
            const stats = {};

            // Common stats
            stats.totalRevenue = user.role === 'owner' ? '₹1,24,500' : '₹15,200';
            stats.activeTrips = user.role === 'owner' ? 23 : 3;

            // Owner specific stats
            if (user.role === 'owner') {
                const driversCount = await env.DB.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?')
                    .bind('driver').first();
                stats.totalDrivers = driversCount?.count || 0;

                const totalUsers = await env.DB.prepare('SELECT COUNT(*) as count FROM users').first();
                stats.totalUsers = totalUsers?.count || 0;

                const vehiclesCount = await env.DB.prepare('SELECT COUNT(*) as count FROM vehicles').first();
                stats.totalVehicles = vehiclesCount?.count || 0;

                const availableVehicles = await env.DB.prepare('SELECT COUNT(*) as count FROM vehicles WHERE status = ?')
                    .bind('available').first();
                stats.availableVehicles = availableVehicles?.count || 0;

                const inUseVehicles = await env.DB.prepare('SELECT COUNT(*) as count FROM vehicles WHERE status = ?')
                    .bind('in-use').first();
                stats.inUseVehicles = inUseVehicles?.count || 0;
            }

            return jsonResponse({ stats });

        } catch (error) {
            return errorResponse(error.message);
        }
    }
}
