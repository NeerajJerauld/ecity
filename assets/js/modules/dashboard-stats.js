import { API } from '../api.js';

export const DashboardStats = {
    async load(currentUser) {
        try {
            const data = await API.get('/api/dashboard');
            const stats = data.stats || {};
            
            // Update common stats
            this.updateElement('totalRevenue', stats.totalRevenue || '₹0');
            this.updateElement('activeTrips', stats.activeTrips || '0');
            
            // Update owner-specific stats
            if (currentUser.role === 'owner') {
                this.updateElement('totalDrivers', stats.totalDrivers || '0');
                this.updateElement('totalVehicles', stats.totalVehicles || '0');
            }
            
            return stats;
        } catch (error) {
            console.error('Failed to load dashboard stats:', error);
            // Optionally show error to user
        }
    },

    updateElement(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }
};
