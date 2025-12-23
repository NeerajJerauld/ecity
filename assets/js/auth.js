export const Auth = {
    login(userData) {
        const { token, role, name, id, permissions } = userData;
        localStorage.setItem('authToken', token);
        localStorage.setItem('userRole', role);
        localStorage.setItem('userName', name);
        localStorage.setItem('userId', id);
        localStorage.setItem('userPermissions', permissions);
    },

    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        localStorage.removeItem('userId');
        localStorage.removeItem('userPermissions');
        window.location.href = '/';
    },

    currentUser() {
        const token = localStorage.getItem('authToken');
        if (!token) return null;

        return {
            token,
            id: localStorage.getItem('userId'),
            name: localStorage.getItem('userName'),
            role: localStorage.getItem('userRole'),
            permissions: localStorage.getItem('userPermissions')
        };
    },

    isAuthenticated() {
        return !!localStorage.getItem('authToken');
    },

    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = '/';
            return false;
        }
        return true;
    }
};
