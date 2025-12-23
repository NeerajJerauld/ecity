import { API } from '../api.js';

export const UserManager = {
    users: [],
    currentEditingUser: null,
    pendingDeleteUserId: null,

    async loadUsers() {
        try {
            const data = await API.get('/api/users');
            this.users = data.users || [];
            this.renderUsers();
        } catch (error) {
            console.error('Error loading users:', error);
            // alert('Failed to load users'); // Optional: Use a UI notification service
        }
    },

    renderUsers() {
        const tbody = document.getElementById('usersTableBody');
        const emptyState = document.getElementById('usersEmptyState');
        const table = document.getElementById('usersTable');

        if (!tbody || !table) return;

        if (this.users.length === 0) {
            table.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        table.style.display = 'table';
        emptyState.style.display = 'none';

        tbody.innerHTML = this.users.map(user => `
            <tr class="fade-in">
                <td>
                    <div class="user-avatar">${user.name.charAt(0).toUpperCase()}</div>
                    <div class="user-info">
                        <div class="user-name">${this.escapeHtml(user.name)}</div>
                        <div class="user-username">@${this.escapeHtml(user.username)}</div>
                    </div>
                </td>
                <td><span class="badge badge-${user.role}">${user.role}</span></td>
                <td>${user.permissions || 'basic'}</td>
                <td><span class="badge badge-${user.status || 'active'}">${user.status || 'active'}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon" data-action="edit" data-id="${user.id}" title="Edit user">
                            ✏️
                        </button>
                        <button class="btn-icon danger" data-action="delete" data-id="${user.id}" title="Delete user">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Re-attach event listeners for dynamic buttons
        this.attachTableListeners();
    },

    attachTableListeners() {
        document.querySelectorAll('.btn-icon[data-action="edit"]').forEach(btn => {
            btn.addEventListener('click', () => this.openUserModal(parseInt(btn.dataset.id)));
        });
        document.querySelectorAll('.btn-icon[data-action="delete"]').forEach(btn => {
            btn.addEventListener('click', () => this.deleteUser(parseInt(btn.dataset.id)));
        });
    },

    openUserModal(userId = null) {
        this.currentEditingUser = userId;
        const modal = document.getElementById('userModal');
        const title = document.getElementById('userModalTitle');
        const form = document.getElementById('userForm');

        if (!modal) return;

        // Reset form
        form.reset();
        const errorEl = document.getElementById('formError');
        if (errorEl) errorEl.style.display = 'none';

        if (userId) {
            // Edit mode
            const user = this.users.find(u => u.id === userId);
            if (user) {
                title.textContent = 'Edit User';
                document.getElementById('userId').value = user.id;
                document.getElementById('userName').value = user.name;
                document.getElementById('userUsername').value = user.username;
                const pwd = document.getElementById('userPassword');
                pwd.value = '';
                pwd.placeholder = 'Leave empty to keep current password';
                pwd.required = false;
                document.getElementById('userRole').value = user.role;
                document.getElementById('userPermissions').value = user.permissions || 'basic';
                document.getElementById('userStatus').value = user.status || 'active';
            }
        } else {
            // Add mode
            title.textContent = 'Add New User';
            const pwd = document.getElementById('userPassword');
            pwd.required = true;
            pwd.placeholder = 'Enter password';
            document.getElementById('userStatus').value = 'active';
        }

        modal.classList.add('active');
    },

    closeUserModal() {
        const modal = document.getElementById('userModal');
        if (modal) modal.classList.remove('active');
        this.currentEditingUser = null;
    },

    async saveUser() {
        const userId = document.getElementById('userId').value;
        const name = document.getElementById('userName').value.trim();
        const username = document.getElementById('userUsername').value.trim();
        const password = document.getElementById('userPassword').value;
        const role = document.getElementById('userRole').value;
        const permissions = document.getElementById('userPermissions').value;
        const status = document.getElementById('userStatus').value;

        // Validation
        if (!name || !username || !role) {
            this.showFormError('Please fill in all required fields');
            return;
        }

        if (!userId && !password) {
            this.showFormError('Password is required for new users');
            return;
        }

        const userData = { name, username, role, permissions, status };
        if (password) userData.password = password;

        try {
            if (userId) {
                await API.put(`/api/users/${userId}`, userData);
            } else {
                await API.post('/api/users', userData);
            }

            this.closeUserModal();
            this.loadUsers();
            alert(userId ? 'User updated successfully' : 'User created successfully');
        } catch (error) {
            console.error('Error saving user:', error);
            this.showFormError(error.message);
        }
    },

    deleteUser(userId) {
        this.pendingDeleteUserId = userId;
        const modal = document.getElementById('deleteConfirmModal');
        if (modal) modal.classList.add('active');
    },

    async confirmDelete() {
        if (!this.pendingDeleteUserId) return;

        const modal = document.getElementById('deleteConfirmModal');
        if (modal) modal.classList.remove('active');

        try {
            await API.delete(`/api/users/${this.pendingDeleteUserId}`);
            await this.loadUsers();
            alert('User deleted successfully');
        } catch (error) {
            console.error('Error deleting user:', error);
            alert(error.message);
        } finally {
            this.pendingDeleteUserId = null;
        }
    },

    cancelDelete() {
        const modal = document.getElementById('deleteConfirmModal');
        if (modal) modal.classList.remove('active');
        this.pendingDeleteUserId = null;
    },

    // Utility
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    showFormError(message) {
        const errorEl = document.getElementById('formError');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
        }
    }
};
