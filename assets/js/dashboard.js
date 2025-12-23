import { Auth } from './auth.js';
import { DashboardStats } from './modules/dashboard-stats.js';
import { UserManager } from './modules/user-manager.js';

// Configuration & State
const App = {
    init() {
        if (!Auth.requireAuth()) return;
        
        this.currentUser = Auth.currentUser();
        this.setupUI();
        this.setupEventListeners();
        this.loadData();
    },

    setupUI() {
        const { role, name } = this.currentUser;

        // Set sidebar info
        const nameEl = document.getElementById('sidebarUserName');
        const roleEl = document.getElementById('sidebarUserRole');
        const avatarEl = document.getElementById('sidebarUserAvatar');

        if (nameEl) nameEl.textContent = name;
        if (roleEl) roleEl.textContent = role;
        if (avatarEl) avatarEl.textContent = name.charAt(0).toUpperCase();

        // Show/hide owner-only elements
        if (role === 'owner') {
            document.querySelectorAll('.owner-only').forEach(el => el.style.display = '');
        }
    },

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item[data-view]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchView(item.getAttribute('data-view'));
                
                document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
            });
        });

        // Sign Out
        const signOutBtn = document.getElementById('signOutLink');
        if (signOutBtn) signOutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            Auth.logout();
        });

        // User Management Events
        const addUserBtn = document.getElementById('addUserBtn');
        const addUserBtnTop = document.getElementById('addUserBtnTop');
        if (addUserBtn) addUserBtn.addEventListener('click', () => UserManager.openUserModal());
        if (addUserBtnTop) addUserBtnTop.addEventListener('click', () => UserManager.openUserModal());

        document.getElementById('closeUserModal')?.addEventListener('click', () => UserManager.closeUserModal());
        document.getElementById('cancelUserBtn')?.addEventListener('click', () => UserManager.closeUserModal());
        document.getElementById('saveUserBtn')?.addEventListener('click', () => UserManager.saveUser());

        // Delete Modal
        document.getElementById('closeDeleteModal')?.addEventListener('click', () => UserManager.cancelDelete());
        document.getElementById('cancelDelete')?.addEventListener('click', () => UserManager.cancelDelete());
        document.getElementById('confirmDelete')?.addEventListener('click', () => UserManager.confirmDelete());
    },

    switchView(viewName) {
        // Hide all views
        document.querySelectorAll('.view-content').forEach(view => view.style.display = 'none');

        // Show selected view
        const viewId = `${viewName}View`;
        const viewElement = document.getElementById(viewId);
        if (viewElement) viewElement.style.display = 'block';

        // Update Header Title
        const titles = {
            'dashboard': 'Dashboard',
            'users': 'User Management',
            'trips': 'Trips',
            'vehicles': 'Vehicles'
        };
        const titleEl = document.getElementById('headerTitle');
        if (titleEl) titleEl.textContent = titles[viewName] || 'Dashboard';

        // Load View Data
        if (viewName === 'users' && this.currentUser.role === 'owner') {
            UserManager.loadUsers();
        }
        if (viewName === 'vehicles' && window.loadVehicles) {
             // Keep backward compatibility for vehicle.js if it's still global
             // Ideally refactor vehicle.js too, but for now we call the global function
             window.loadVehicles(); 
        }
    },

    loadData() {
        DashboardStats.load(this.currentUser);
        
        // If owner, pre-load users or just wait for view switch?
        // Original code loaded users if owner.
        if (this.currentUser.role === 'owner') {
            UserManager.loadUsers();
        }
    }
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => App.init());
