import { jsonResponse, errorResponse } from '../utils/response.js';

export class EmailController {
    static async send(request, env) {
        try {
            const data = await request.json();
            
            if (!data.name || !data.phone) {
                return errorResponse('Name and Phone are required', 400);
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
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({
                personalizations: [{ to: [{ email: 'neeraj.jerauld@gmail.com', name: 'Neeraj Jerauld' }] }],
                from: { email: 'no-reply@ecitylogistics.com', name: 'Ecity Web Form' },
                subject: subject,
                content: [{ type: 'text/plain', value: text }],
              }),
            });
      
            const response = await fetch(sendRequest);
      
            if (response.ok) {
                return jsonResponse({ success: true });
            } else {
                const errorText = await response.text();
                return errorResponse(`Failed to send email: ${errorText}`, 500);
            }

        } catch (error) {
            return errorResponse(error.message);
        }
    }
}
