// Dashboard JavaScript - User Management & Navigation

// Configuration
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://127.0.0.1:8787' 
    : 'https://ecity-enquiry-worker.deepuavm.workers.dev';

// State
let currentUser = null;
let users = [];
let currentEditingUser = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', init);

function init() {
    // Check authentication
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('userRole');
    const name = localStorage.getItem('userName');
    const userId = localStorage.getItem('userId');
    const permissions = localStorage.getItem('userPermissions');

    if (!token || !role || !name) {
        window.location.href = '/';
        return;
    }

    currentUser = { token, role, name, id: userId, permissions };

    // Setup UI based on role
    setupUI();
    
    // Load dashboard data
    loadDashboardData();

    // Setup event listeners
    setupEventListeners();

    // If owner, load users
    if (role === 'owner') {
        loadUsers();
    }
}

function setupUI() {
    const { role, name } = currentUser;

    // Set user info in sidebar
    document.getElementById('sidebarUserName').textContent = name;
    document.getElementById('sidebarUserRole').textContent = role;
    document.getElementById('sidebarUserAvatar').textContent = name.charAt(0).toUpperCase();

    // Show/hide owner-only elements
    if (role === 'owner') {
        document.querySelectorAll('.owner-only').forEach(el => {
            el.style.display = '';
        });
    }
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item[data-view]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const view = item.getAttribute('data-view');
            switchView(view);
            
            // Update active state
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // Sign out
    document.getElementById('signOutLink').addEventListener('click', (e) => {
        e.preventDefault();
        signOut();
    });

    // User management
    const addUserBtn = document.getElementById('addUserBtn');
    const addUserBtnTop = document.getElementById('addUserBtnTop');
    if (addUserBtn) addUserBtn.addEventListener('click', () => openUserModal());
    if (addUserBtnTop) addUserBtnTop.addEventListener('click', () => openUserModal());

    document.getElementById('closeUserModal').addEventListener('click', closeUserModal);
    document.getElementById('cancelUserBtn').addEventListener('click', closeUserModal);
    document.getElementById('saveUserBtn').addEventListener('click', saveUser);

    // Close modal on overlay click
    document.getElementById('userModal').addEventListener('click', (e) => {
        if (e.target.id === 'userModal') {
            closeUserModal();
        }
    });
}

function switchView(viewName) {
    // Hide all views
    document.querySelectorAll('.view-content').forEach(view => {
        view.style.display = 'none';
    });

    // Show selected view
    const viewId = `${viewName}View`;
    const viewElement = document.getElementById(viewId);
    if (viewElement) {
        viewElement.style.display = 'block';
    }

    // Update header title
    const titles = {
        'dashboard': 'Dashboard',
        'users': 'User Management',
        'trips': 'Trips',
        'vehicles': 'Vehicles'
    };
    document.getElementById('headerTitle').textContent = titles[viewName] || 'Dashboard';

    // Load data for specific views
    if (viewName === 'users' && currentUser.role === 'owner') {
        loadUsers();
    }
}

function loadDashboardData() {
    // Fetch real statistics from API
    fetch(`${API_URL}/api/dashboard`, {
        method: 'GET',
        headers: {
            'Authorization': currentUser.token,
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        const stats = data.stats || {};
        
        // Update revenue and trips
        document.getElementById('totalRevenue').textContent = stats.totalRevenue || '₹0';
        document.getElementById('activeTrips').textContent = stats.activeTrips || '0';
        
        // Update owner-specific stats
        if (currentUser.role === 'owner') {
            document.getElementById('totalDrivers').textContent = stats.totalDrivers || '0';
            document.getElementById('totalVehicles').textContent = stats.totalVehicles || '0';
        }
    })
    .catch(error => {
        console.error('Error loading dashboard data:', error);
    });
}

// User Management Functions
async function loadUsers() {
    try {
        const response = await fetch(`${API_URL}/api/users`, {
            method: 'GET',
            headers: {
                'Authorization': currentUser.token,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch users');
        }

        const data = await response.json();
        users = data.users || [];
        renderUsers();
    } catch (error) {
        console.error('Error loading users:', error);
        showError('Failed to load users');
    }
}

function renderUsers() {
    const tbody = document.getElementById('usersTableBody');
    const emptyState = document.getElementById('usersEmptyState');
    const table = document.getElementById('usersTable');

    if (users.length === 0) {
        table.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    table.style.display = 'table';
    emptyState.style.display = 'none';

    tbody.innerHTML = users.map(user => `
        <tr class="fade-in">
            <td>
                <div class="user-avatar">${user.name.charAt(0).toUpperCase()}</div>
                <div class="user-info">
                    <div class="user-name">${escapeHtml(user.name)}</div>
                    <div class="user-username">@${escapeHtml(user.username)}</div>
                </div>
            </td>
            <td><span class="badge badge-${user.role}">${user.role}</span></td>
            <td>${user.permissions || 'basic'}</td>
            <td><span class="badge badge-${user.status || 'active'}">${user.status || 'active'}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon" onclick="editUser(${user.id})" title="Edit user">
                        ✏️
                    </button>
                    <button class="btn-icon danger" onclick="deleteUser(${user.id})" title="Delete user">
                        🗑️
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function openUserModal(userId = null) {
    currentEditingUser = userId;
    const modal = document.getElementById('userModal');
    const title = document.getElementById('userModalTitle');
    const form = document.getElementById('userForm');

    // Reset form
    form.reset();
    document.getElementById('formError').style.display = 'none';

    if (userId) {
        // Edit mode
        const user = users.find(u => u.id === userId);
        if (user) {
            title.textContent = 'Edit User';
            document.getElementById('userId').value = user.id;
            document.getElementById('userName').value = user.name;
            document.getElementById('userUsername').value = user.username;
            document.getElementById('userPassword').value = ''; // Don't show password
            document.getElementById('userPassword').placeholder = 'Leave empty to keep current password';
            document.getElementById('userPassword').required = false;
            document.getElementById('userRole').value = user.role;
            document.getElementById('userPermissions').value = user.permissions || 'basic';
            document.getElementById('userStatus').value = user.status || 'active';
        }
    } else {
        // Add mode
        title.textContent = 'Add New User';
        document.getElementById('userPassword').required = true;
        document.getElementById('userPassword').placeholder = 'Enter password';
        document.getElementById('userStatus').value = 'active';
    }

    modal.classList.add('active');
}

function closeUserModal() {
    document.getElementById('userModal').classList.remove('active');
    currentEditingUser = null;
}

async function saveUser() {
    const userId = document.getElementById('userId').value;
    const name = document.getElementById('userName').value.trim();
    const username = document.getElementById('userUsername').value.trim();
    const password = document.getElementById('userPassword').value;
    const role = document.getElementById('userRole').value;
    const permissions = document.getElementById('userPermissions').value;
    const status = document.getElementById('userStatus').value;

    // Validation
    if (!name || !username || !role) {
        showFormError('Please fill in all required fields');
        return;
    }

    if (!userId && !password) {
        showFormError('Password is required for new users');
        return;
    }

    const userData = {
        name,
        username,
        role,
        permissions,
        status
    };

    // Only include password if it's provided
    if (password) {
        userData.password = password;
    }

    try {
        const url = userId 
            ? `${API_URL}/api/users/${userId}` 
            : `${API_URL}/api/users`;
        
        const method = userId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: {
                'Authorization': currentUser.token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to save user');
        }

        // Success
        closeUserModal();
        loadUsers();
        showSuccess(userId ? 'User updated successfully' : 'User created successfully');
    } catch (error) {
        console.error('Error saving user:', error);
        showFormError(error.message);
    }
}

window.editUser = function(userId) {
    openUserModal(userId);
};

let pendingDeleteUserId = null;

window.deleteUser = function(userId) {
    console.log('deleteUser called with userId:', userId);
    pendingDeleteUserId = userId;
    
    // Show custom confirmation modal
    document.getElementById('deleteConfirmModal').classList.add('active');
};

// Setup delete modal handlers
document.getElementById('closeDeleteModal').addEventListener('click', () => {
    document.getElementById('deleteConfirmModal').classList.remove('active');
    pendingDeleteUserId = null;
});

document.getElementById('cancelDelete').addEventListener('click', () => {
    document.getElementById('deleteConfirmModal').classList.remove('active');
    pendingDeleteUserId = null;
});

document.getElementById('confirmDelete').addEventListener('click', async () => {
    if (!pendingDeleteUserId) return;
    
    // Close modal
    document.getElementById('deleteConfirmModal').classList.remove('active');
    
    console.log('User confirmed delete for userId:', pendingDeleteUserId);
    
    try {
        const url = `${API_URL}/api/users/${pendingDeleteUserId}`;
        console.log('DELETE URL:', url);
        
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Authorization': currentUser.token,
                'Content-Type': 'application/json'
            }
        });

        console.log('Response status:', response.status, response.statusText);

        if (!response.ok) {
            const data = await response.json();
            console.error('Delete failed:', data);
            throw new Error(data.error || 'Failed to delete user');
        }

        const data = await response.json();
        console.log('Delete response:', data);
        
        if (data.success) {
            console.log('Delete successful, reloading users...');
            await loadUsers();
            showSuccess('User deleted successfully');
        } else {
            throw new Error('Delete operation did not return success');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        showError(error.message);
    } finally {
        pendingDeleteUserId = null;
    }
});

function signOut() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
    localStorage.removeItem('userPermissions');
    window.location.href = '/';
}

// Utility Functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showFormError(message) {
    const errorEl = document.getElementById('formError');
    errorEl.textContent = message;
    errorEl.style.display = 'block';
}

function showError(message) {
    // Simple alert for now - can be enhanced with toast notifications
    alert('Error: ' + message);
}

function showSuccess(message) {
    // Simple alert for now - can be enhanced with toast notifications
    alert(message);
}
