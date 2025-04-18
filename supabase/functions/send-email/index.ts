import { Resend } from 'npm:resend@2.1.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Initialize Resend with API key from environment variable
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    if (!resend) {
      throw new Error('Missing Resend API key');
    }

    // Parse the request body
    const { to, subject, html }: EmailPayload = await req.json();

    // Validate required fields
    if (!to || !subject || !html) {
      throw new Error('Missing required fields');
    }

    // Send the email
    const { data, error } = await resend.emails.send({
      from: 'Clutch Jobs <no-reply@clutchjobs.ca>',
      to,
      subject,
      html,
    });

    if (error) {
      throw error;
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        data,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
        status: 200,
      }
    );
  } catch (error) {
    // Return error response
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
        status: error.message === 'Method not allowed' ? 405 : 400,
      }
    );
  }
});