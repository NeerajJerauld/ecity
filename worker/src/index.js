export default {
    async fetch(request, env, ctx) {
      const url = new URL(request.url);
      
      // CORS headers
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
                 role: user.role, // 'owner' or 'driver'
                 name: user.name 
             }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          } else {
             return new Response(JSON.stringify({ error: 'Invalid credentials' }), { 
                 status: 401, 
                 headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
             });
          }
        }

        // ROUTE: /api/dashboard
        if (url.pathname === '/api/dashboard') {
             // Mock Data Response based on role (could pass role in header/query for now)
             // simplified for example
             return new Response(JSON.stringify({ message: "Dashboard data" }), {
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
