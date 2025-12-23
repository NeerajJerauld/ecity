import { jsonResponse, errorResponse } from '../utils/response.js';

export class UserController {
    static async list(request, env, user) {
        if (user.role !== 'owner') return errorResponse('Forbidden', 403);

        try {
            const { results } = await env.DB.prepare('SELECT id, username, role, name, permissions, status, created_at FROM users').all();
            return jsonResponse({ users: results });
        } catch (error) {
            return errorResponse(error.message);
        }
    }

    static async create(request, env, user) {
        if (user.role !== 'owner') return errorResponse('Forbidden', 403);

        try {
            const { username, password, role, name, permissions } = await request.json();
            
            if (!username || !password || !role || !name) {
                return errorResponse('Missing required fields', 400);
            }

            try {
                await env.DB.prepare('INSERT INTO users (username, password, role, name, permissions) VALUES (?, ?, ?, ?, ?)')
                    .bind(username, password, role, name, permissions || 'basic').run();
                return jsonResponse({ success: true, message: 'User created successfully' });
            } catch (e) {
                return errorResponse('Username already exists', 400);
            }
        } catch (error) {
            return errorResponse(error.message);
        }
    }

    static async update(request, env, user, targetUserId) {
        if (user.role !== 'owner') return errorResponse('Forbidden', 403);

        try {
            const { username, password, role, name, permissions, status } = await request.json();

            let updateQuery = 'UPDATE users SET updated_at = CURRENT_TIMESTAMP';
            const params = [];

            if (username) { updateQuery += ', username = ?'; params.push(username); }
            if (password) { updateQuery += ', password = ?'; params.push(password); }
            if (role) { updateQuery += ', role = ?'; params.push(role); }
            if (name) { updateQuery += ', name = ?'; params.push(name); }
            if (permissions) { updateQuery += ', permissions = ?'; params.push(permissions); }
            if (status) { updateQuery += ', status = ?'; params.push(status); }

            updateQuery += ' WHERE id = ?';
            params.push(targetUserId);

            await env.DB.prepare(updateQuery).bind(...params).run();

            return jsonResponse({ success: true, message: 'User updated successfully' });
        } catch (error) {
            return errorResponse(error.message);
        }
    }

    static async delete(request, env, user, targetUserId) {
        if (user.role !== 'owner') return errorResponse('Forbidden', 403);

        if (String(user.id) === String(targetUserId)) {
            return errorResponse('Cannot delete your own account', 400);
        }

        try {
            await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(targetUserId).run();
            return jsonResponse({ success: true, message: 'User deleted successfully' });
        } catch (error) {
            return errorResponse(error.message);
        }
    }
}
