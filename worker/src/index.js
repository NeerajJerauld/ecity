export default {
    async fetch(request, env, ctx) {
      const url = new URL(request.url);
      
      // CORS headers
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      };
  
      if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
      }
  
      try {
        // ROUTE: /auth/login
        if (url.pathname === '/auth/login' && request.method === 'POST') {
          const { username, password } = await request.json();
          
          // Check D1 Database
          const user = await env.DB.prepare('SELECT * FROM users WHERE username = ? AND password = ?')
            .bind(username, password)
            .first();

          if (user) {
             return new Response(JSON.stringify({ 
                 token: 'd1-token-' + user.id, 
                 role: user.role,
                 name: user.name,
                 id: user.id,
                 permissions: user.permissions
             }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          } else {
             return new Response(JSON.stringify({ error: 'Invalid credentials' }), { 
                 status: 401, 
                 headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
             });
          }
        }

        // ROUTE: /api/dashboard - Get dashboard statistics
        if (url.pathname === '/api/dashboard') {
            const authHeader = request.headers.get('Authorization');
            if (!authHeader) {
                return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
                    status: 401, 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                });
            }

            const userId = authHeader.replace('d1-token-', '');
            const requestUser = await env.DB.prepare('SELECT * FROM users WHERE id = ?')
                .bind(userId).first();

            if (!requestUser) {
                return new Response(JSON.stringify({ error: 'User not found' }), { 
                    status: 404, 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                });
            }

            // Get statistics
            const stats = {};

            // Total users count (owners only)
            if (requestUser.role === 'owner') {
                const driversCount = await env.DB.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?')
                    .bind('driver').first();
                stats.totalDrivers = driversCount?.count || 0;

                const totalUsers = await env.DB.prepare('SELECT COUNT(*) as count FROM users').first();
                stats.totalUsers = totalUsers?.count || 0;

                // Vehicles count
                const vehiclesCount = await env.DB.prepare('SELECT COUNT(*) as count FROM vehicles').first();
                stats.totalVehicles = vehiclesCount?.count || 0;

                const availableVehicles = await env.DB.prepare('SELECT COUNT(*) as count FROM vehicles WHERE status = ?')
                    .bind('available').first();
                stats.availableVehicles = availableVehicles?.count || 0;

                const inUseVehicles = await env.DB.prepare('SELECT COUNT(*) as count FROM vehicles WHERE status = ?')
                    .bind('in-use').first();
                stats.inUseVehicles = inUseVehicles?.count || 0;
            }

            // Mock revenue and trips for now (can be expanded later)
            stats.totalRevenue = requestUser.role === 'owner' ? '₹1,24,500' : '₹15,200';
            stats.activeTrips = requestUser.role === 'owner' ? 23 : 3;

            return new Response(JSON.stringify({ stats }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // ROUTE: GET /api/users - List all users (admin only)
        if (url.pathname === '/api/users' && request.method === 'GET') {
            const authHeader = request.headers.get('Authorization');
            if (!authHeader) {
                return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
                    status: 401, 
                    headers: {  ...corsHeaders, 'Content-Type': 'application/json' } 
                });
            }

            // Get user from token
            const userId = authHeader.replace('d1-token-', '');
            const requestUser = await env.DB.prepare('SELECT * FROM users WHERE id = ?')
                .bind(userId).first();

            if (!requestUser || requestUser.role !== 'owner') {
                return new Response(JSON.stringify({ error: 'Forbidden' }), { 
                    status: 403, 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                });
            }

            // Fetch all users
            const { results } = await env.DB.prepare('SELECT id, username, role, name, permissions, status, created_at FROM users').all();
            return new Response(JSON.stringify({ users: results }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // ROUTE: POST /api/users - Create new user (admin only)
        if (url.pathname === '/api/users' && request.method === 'POST') {
            const authHeader = request.headers.get('Authorization');
            if (!authHeader) {
                return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
                    status: 401, 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                });
            }

            const userId = authHeader.replace('d1-token-', '');
            const requestUser = await env.DB.prepare('SELECT * FROM users WHERE id = ?')
                .bind(userId).first();

            if (!requestUser || requestUser.role !== 'owner') {
                return new Response(JSON.stringify({ error: 'Forbidden' }), { 
                    status: 403, 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                });
            }

            const { username, password, role, name, permissions } = await request.json();
            
            if (!username || !password || !role || !name) {
                return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
                    status: 400, 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                });
            }

            try {
                await env.DB.prepare('INSERT INTO users (username, password, role, name, permissions) VALUES (?, ?, ?, ?, ?)')
                    .bind(username, password, role, name, permissions || 'basic').run();
                
                return new Response(JSON.stringify({ success: true, message: 'User created successfully' }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            } catch (error) {
                return new Response(JSON.stringify({ error: 'Username already exists' }), { 
                    status: 400, 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                });
            }
        }

        // ROUTE: PUT /api/users/:id - Update user (admin only)
        if (url.pathname.startsWith('/api/users/') && request.method === 'PUT') {
            const authHeader = request.headers.get('Authorization');
            if (!authHeader) {
                return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
                    status: 401, 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                });
            }

            const reqUserId = authHeader.replace('d1-token-', '');
            const requestUser = await env.DB.prepare('SELECT * FROM users WHERE id = ?')
                .bind(reqUserId).first();

            if (!requestUser || requestUser.role !== 'owner') {
                return new Response(JSON.stringify({ error: 'Forbidden' }), { 
                    status: 403, 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                });
            }

            const targetUserId = url.pathname.split('/').pop();
            const { username, password, role, name, permissions, status } = await request.json();

            let updateQuery = 'UPDATE users SET updated_at = CURRENT_TIMESTAMP';
            const params = [];

            if (username) {
                updateQuery += ', username = ?';
                params.push(username);
            }
            if (password) {
                updateQuery += ', password = ?';
                params.push(password);
            }
            if (role) {
                updateQuery += ', role = ?';
                params.push(role);
            }
            if (name) {
                updateQuery += ', name = ?';
                params.push(name);
            }
            if (permissions) {
                updateQuery += ', permissions = ?';
                params.push(permissions);
            }
            if (status) {
                updateQuery += ', status = ?';
                params.push(status);
            }

            updateQuery += ' WHERE id = ?';
            params.push(targetUserId);

            await env.DB.prepare(updateQuery).bind(...params).run();

            return new Response(JSON.stringify({ success: true, message: 'User updated successfully' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // ROUTE: DELETE /api/users/:id - Delete user (admin only)
        if (url.pathname.startsWith('/api/users/') && request.method === 'DELETE') {
            const authHeader = request.headers.get('Authorization');
            if (!authHeader) {
                return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
                    status: 401, 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                });
            }

            const reqUserId = authHeader.replace('d1-token-', '');
            const requestUser = await env.DB.prepare('SELECT * FROM users WHERE id = ?')
                .bind(reqUserId).first();

            if (!requestUser || requestUser.role !== 'owner') {
                return new Response(JSON.stringify({ error: 'Forbidden' }), { 
                    status: 403, 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                });
            }

            const targetUserId = url.pathname.split('/').pop();
            
            // Don't allow deleting yourself
            if (targetUserId === reqUserId) {
                return new Response(JSON.stringify({ error: 'Cannot delete your own account' }), { 
                    status: 400, 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                });
            }

            await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(targetUserId).run();

            return new Response(JSON.stringify({ success: true, message: 'User deleted successfully' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // ROUTE: GET /api/vehicles - List all vehicles (owner only)
        if (url.pathname === '/api/vehicles' && request.method === 'GET') {
            const authHeader = request.headers.get('Authorization');
            if (!authHeader) {
                return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
                    status: 401, 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                });
            }

            const userId = authHeader.replace('d1-token-', '');
            const requestUser = await env.DB.prepare('SELECT * FROM users WHERE id = ?')
                .bind(userId).first();

            if (!requestUser || requestUser.role !== 'owner') {
                return new Response(JSON.stringify({ error: 'Forbidden' }), { 
                    status: 403, 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                });
            }

            const { results } = await env.DB.prepare(`
                SELECT v.*, u.name as driver_name 
                FROM vehicles v 
                LEFT JOIN users u ON v.driver_id = u.id
            `).all();
            
            return new Response(JSON.stringify({ vehicles: results }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // ROUTE: POST /api/vehicles - Create new vehicle (owner only)
        if (url.pathname === '/api/vehicles' && request.method === 'POST') {
            const authHeader = request.headers.get('Authorization');
            if (!authHeader) {
                return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
                    status: 401, 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                });
            }

            const userId = authHeader.replace('d1-token-', '');
            const requestUser = await env.DB.prepare('SELECT * FROM users WHERE id = ?')
                .bind(userId).first();

            if (!requestUser || requestUser.role !== 'owner') {
                return new Response(JSON.stringify({ error: 'Forbidden' }), { 
                    status: 403, 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                });
            }

            const { vehicle_number, vehicle_type, model, capacity, status, driver_id } = await request.json();
            
            if (!vehicle_number || !vehicle_type || !model) {
                return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
                    status: 400, 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                });
            }

            try {
                await env.DB.prepare(`
                    INSERT INTO vehicles (vehicle_number, vehicle_type, model, capacity, status, driver_id) 
                    VALUES (?, ?, ?, ?, ?, ?)
                `).bind(vehicle_number, vehicle_type, model, capacity || null, status || 'available', driver_id || null).run();
                
                return new Response(JSON.stringify({ success: true, message: 'Vehicle created successfully' }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            } catch (error) {
                return new Response(JSON.stringify({ error: 'Vehicle number already exists' }), { 
                    status: 400, 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                });
            }
        }

        // ROUTE: PUT /api/vehicles/:id - Update vehicle (owner only)
        if (url.pathname.startsWith('/api/vehicles/') && request.method === 'PUT') {
            const authHeader = request.headers.get('Authorization');
            if (!authHeader) {
                return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
                    status: 401, 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                });
            }

            const userId = authHeader.replace('d1-token-', '');
            const requestUser = await env.DB.prepare('SELECT * FROM users WHERE id = ?')
                .bind(userId).first();

            if (!requestUser || requestUser.role !== 'owner') {
                return new Response(JSON.stringify({ error: 'Forbidden' }), { 
                    status: 403, 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                });
            }

            const vehicleId = url.pathname.split('/').pop();
            const { vehicle_number, vehicle_type, model, capacity, status, driver_id } = await request.json();

            let updateQuery = 'UPDATE vehicles SET updated_at = CURRENT_TIMESTAMP';
            const params = [];

            if (vehicle_number) {
                updateQuery += ', vehicle_number = ?';
                params.push(vehicle_number);
            }
            if (vehicle_type) {
                updateQuery += ', vehicle_type = ?';
                params.push(vehicle_type);
            }
            if (model) {
                updateQuery += ', model = ?';
                params.push(model);
            }
            if (capacity !== undefined) {
                updateQuery += ', capacity = ?';
                params.push(capacity);
            }
            if (status) {
                updateQuery += ', status = ?';
                params.push(status);
            }
            if (driver_id !== undefined) {
                updateQuery += ', driver_id = ?';
                params.push(driver_id || null);
            }

            updateQuery += ' WHERE id = ?';
            params.push(vehicleId);

            await env.DB.prepare(updateQuery).bind(...params).run();

            return new Response(JSON.stringify({ success: true, message: 'Vehicle updated successfully' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // ROUTE: DELETE /api/vehicles/:id - Delete vehicle (owner only)
        if (url.pathname.startsWith('/api/vehicles/') && request.method === 'DELETE') {
            const authHeader = request.headers.get('Authorization');
            if (!authHeader) {
                return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
                    status: 401, 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                });
            }

            const userId = authHeader.replace('d1-token-', '');
            const requestUser = await env.DB.prepare('SELECT * FROM users WHERE id = ?')
                .bind(userId).first();

            if (!requestUser || requestUser.role !== 'owner') {
                return new Response(JSON.stringify({ error: 'Forbidden' }), { 
                    status: 403, 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                });
            }

            const vehicleId = url.pathname.split('/').pop();

            await env.DB.prepare('DELETE FROM vehicles WHERE id = ?').bind(vehicleId).run();

            return new Response(JSON.stringify({ success: true, message: 'Vehicle deleted successfully' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
  
        // ROUTE: EXISTING EMAIL HANDLER (Default or specific path)
        // If it's a POST to root or /send, treat as email form
        if (request.method === 'POST' && (url.pathname === '/' || url.pathname === '/send')) {
             return await handleEmail(request, corsHeaders);
        }
        
        return new Response('Not Found', { status: 404, headers: corsHeaders });
  
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    },
  };

  async function handleEmail(request, corsHeaders) {
        const data = await request.json();
        
        if (!data.name || !data.phone) {
             return new Response(JSON.stringify({ error: 'Name and Phone are required' }), { 
                status: 400, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
             });
        }
  
        const subject = `New Inquiry from ${data.name}`;
        const text = `
    New Website Inquiry:
    
    Name: ${data.name}
    Phone: ${data.phone}
    Pickup: ${data.pickup || 'N/A'}
    Drop: ${data.drop || 'N/A'}
    Message: ${data.message || 'N/A'}
    
    -----------------------------------
    Sent from Ecity Logistics Website
        `;
  
        const sendRequest = new Request('https://api.mailchannels.net/tx/v1/send', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [
              {
                to: [{ email: 'neeraj.jerauld@gmail.com', name: 'Neeraj Jerauld' }],
              },
            ],
            from: {
              email: 'no-reply@ecitylogistics.com', 
              name: 'Ecity Web Form',
            },
            subject: subject,
            content: [
              {
                type: 'text/plain',
                value: text,
              },
            ],
          }),
        });
  
        const response = await fetch(sendRequest);
  
        if (response.ok) {
            return new Response(JSON.stringify({ success: true }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        } else {
            const errorText = await response.text();
             return new Response(JSON.stringify({ error: 'Failed to send email via provider', details: errorText }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }
  }
