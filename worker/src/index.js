export default {
    async fetch(request, env, ctx) {
      // CORS headers to allow requests from your website
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      };
  
      if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
      }
  
      if (request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
      }
  
      try {
        const data = await request.json();
        
        // Validation
        if (!data.name || !data.phone) {
             return new Response(JSON.stringify({ error: 'Name and Phone are required' }), { 
                status: 400, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
             });
        }
  
        // Construct email content
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
  
        // Send using MailChannels (Free for Cloudflare Workers)
        // Note: For this to work reliably, ensure your domain has SPF records for MailChannels 
        // or usage from a .workers.dev tailored domain might be restricted in some cases.
        // https://developers.cloudflare.com/pages/platform/functions/plugins/mailchannels/
        
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
              email: 'no-reply@ecitylogistics.com', // Ideally valid sender on your domain
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
  
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    },
  };
