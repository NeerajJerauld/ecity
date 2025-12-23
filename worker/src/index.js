import { handleOptions, errorResponse } from './utils/response.js';
import { AuthController } from './controllers/auth.js';
import { DashboardController } from './controllers/dashboard.js';
import { UserController } from './controllers/users.js';
import { VehicleController } from './controllers/vehicles.js';
import { EmailController } from './controllers/email.js';

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // Global CORS Preflight
        if (request.method === 'OPTIONS') {
            return handleOptions();
        }

        try {
            // --- PUBLIC ROUTES ---
            
            // Auth
            if (url.pathname === '/auth/login' && request.method === 'POST') {
                return await AuthController.login(request, env);
            }

            // Email (Contact Form)
            if (request.method === 'POST' && (url.pathname === '/' || url.pathname === '/send')) {
                return await EmailController.send(request, env);
            }

            // --- PROTECTED ROUTES ---
            
            // Protected routes check
            if (url.pathname.startsWith('/api/')) {
                const user = await AuthController.requireAuth(request, env);
                if (!user) return errorResponse('Unauthorized', 401);

                // Dashboard
                if (url.pathname === '/api/dashboard') {
                    return await DashboardController.getStats(request, env, user);
                }

                // Users Logic
                if (url.pathname === '/api/users') {
                    if (request.method === 'GET') return await UserController.list(request, env, user);
                    if (request.method === 'POST') return await UserController.create(request, env, user);
                }
                
                if (url.pathname.startsWith('/api/users/')) {
                    const id = url.pathname.split('/').pop();
                    if (request.method === 'PUT') return await UserController.update(request, env, user, id);
                    if (request.method === 'DELETE') return await UserController.delete(request, env, user, id);
                }

                // Vehicles Logic
                if (url.pathname === '/api/vehicles') {
                    if (request.method === 'GET') return await VehicleController.list(request, env, user);
                    if (request.method === 'POST') return await VehicleController.create(request, env, user);
                }

                if (url.pathname.startsWith('/api/vehicles/')) {
                    const id = url.pathname.split('/').pop();
                    if (request.method === 'PUT') return await VehicleController.update(request, env, user, id);
                    if (request.method === 'DELETE') return await VehicleController.delete(request, env, user, id);
                }
            }
            
            return errorResponse('Not Found', 404);

        } catch (err) {
            return errorResponse(err.message, 500);
        }
    }
};
