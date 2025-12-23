import { jsonResponse, errorResponse } from '../utils/response.js';

export class AuthController {
    static async login(request, env) {
        try {
            const { username, password } = await request.json();

            const user = await env.DB.prepare('SELECT * FROM users WHERE username = ? AND password = ?')
                .bind(username, password)
                .first();

            if (user) {
                return jsonResponse({
                    token: 'd1-token-' + user.id,
                    role: user.role,
                    name: user.name,
                    id: user.id,
                    permissions: user.permissions
                });
            } else {
                return errorResponse('Invalid credentials', 401);
            }
        } catch (error) {
            return errorResponse(error.message, 500);
        }
    }

    static async requireAuth(request, env) {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) return null;

        const userId = authHeader.replace('d1-token-', '');
        try {
            const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?')
                .bind(userId).first();
            return user;
        } catch (e) {
            return null;
        }
    }
}
