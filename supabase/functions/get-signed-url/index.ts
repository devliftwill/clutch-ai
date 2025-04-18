import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Use static API key for testing
    const ELEVENLABS_API_KEY = 'sk_3c97af02a0d3bcb16fda806ada7e536113b8ece04b9f1775';
    // Use the correct agent ID provided by the user
    const AGENT_ID = 'KyQmFDIO63UegXTl7MvJ';

    console.log('Making request to ElevenLabs API');
    console.log('Using agent ID:', AGENT_ID);

    // Make request to ElevenLabs API with CORRECT endpoint from their documentation example
    // Note: Using exact URL format from the docs
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${AGENT_ID}`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('ElevenLabs API response status:', response.status);
    
    // Get response data
    const responseText = await response.text();
    console.log('ElevenLabs API response text:', responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Error parsing response JSON:', e);
      return new Response(
        JSON.stringify({
          error: 'Service error',
          message: 'Invalid response from ElevenLabs API',
          details: responseText
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Check for API error response
    if (!response.ok) {
      console.error('ElevenLabs API error:', data);
      return new Response(
        JSON.stringify({
          error: 'Service error',
          message: 'Unable to initialize video interview. Please try again in a few minutes.',
          details: data
        }),
        {
          status: response.status,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Validate signed URL exists in response
    if (!data.signed_url) {
      return new Response(
        JSON.stringify({
          error: 'Service error',
          message: 'Unable to initialize video interview. Please try again in a few minutes.',
          details: 'Missing signed_url in response'
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Return successful response
    return new Response(
      JSON.stringify({ signedUrl: data.signed_url }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error in get-signed-url function:', error);

    return new Response(
      JSON.stringify({
        error: 'Service error',
        message: 'Unable to initialize video interview. Please try again in a few minutes.',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});