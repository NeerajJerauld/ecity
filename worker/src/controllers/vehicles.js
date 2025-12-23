import { jsonResponse, errorResponse } from '../utils/response.js';

export class VehicleController {
    static async list(request, env, user) {
        if (user.role !== 'owner') return errorResponse('Forbidden', 403);

        try {
            const { results } = await env.DB.prepare(`
                SELECT v.*, u.name as driver_name 
                FROM vehicles v 
                LEFT JOIN users u ON v.driver_id = u.id
            `).all();
            return jsonResponse({ vehicles: results });
        } catch (error) {
            return errorResponse(error.message);
        }
    }

    static async create(request, env, user) {
        if (user.role !== 'owner') return errorResponse('Forbidden', 403);

        try {
            const { vehicle_number, vehicle_type, model, capacity, status, driver_id } = await request.json();

            if (!vehicle_number || !vehicle_type || !model) {
                return errorResponse('Missing required fields', 400);
            }

            try {
                await env.DB.prepare(`
                    INSERT INTO vehicles (vehicle_number, vehicle_type, model, capacity, status, driver_id) 
                    VALUES (?, ?, ?, ?, ?, ?)
                `).bind(vehicle_number, vehicle_type, model, capacity || null, status || 'available', driver_id || null).run();
                
                return jsonResponse({ success: true, message: 'Vehicle created successfully' });
            } catch (e) {
                return errorResponse('Vehicle number already exists', 400);
            }
        } catch (error) {
            return errorResponse(error.message);
        }
    }

    static async update(request, env, user, vehicleId) {
        if (user.role !== 'owner') return errorResponse('Forbidden', 403);

        try {
            const { vehicle_number, vehicle_type, model, capacity, status, driver_id } = await request.json();

            let updateQuery = 'UPDATE vehicles SET updated_at = CURRENT_TIMESTAMP';
            const params = [];

            if (vehicle_number) { updateQuery += ', vehicle_number = ?'; params.push(vehicle_number); }
            if (vehicle_type) { updateQuery += ', vehicle_type = ?'; params.push(vehicle_type); }
            if (model) { updateQuery += ', model = ?'; params.push(model); }
            if (capacity !== undefined) { updateQuery += ', capacity = ?'; params.push(capacity); }
            if (status) { updateQuery += ', status = ?'; params.push(status); }
            if (driver_id !== undefined) { updateQuery += ', driver_id = ?'; params.push(driver_id || null); }

            updateQuery += ' WHERE id = ?';
            params.push(vehicleId);

            await env.DB.prepare(updateQuery).bind(...params).run();

            return jsonResponse({ success: true, message: 'Vehicle updated successfully' });
        } catch (error) {
            return errorResponse(error.message);
        }
    }

    static async delete(request, env, user, vehicleId) {
        if (user.role !== 'owner') return errorResponse('Forbidden', 403);

        try {
            await env.DB.prepare('DELETE FROM vehicles WHERE id = ?').bind(vehicleId).run();
            return jsonResponse({ success: true, message: 'Vehicle deleted successfully' });
        } catch (error) {
            return errorResponse(error.message);
        }
    }
}
