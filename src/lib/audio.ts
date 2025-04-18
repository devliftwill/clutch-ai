import { supabase } from './auth';

/**
 * Trigger the store-audio edge function to save ElevenLabs conversation audio
 * 
 * @param applicationId The ID of the application to retrieve audio for
 * @returns A promise resolving to the result of the operation
 */
export async function triggerStoreAudio(applicationId: string): Promise<{success: boolean, message?: string}> {
  try {
    // Get the Supabase URL and extract project ref
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const projectRef = supabaseUrl.match(/https:\/\/(.*?)\.supabase\.co/)?.[1];
    
    if (!projectRef) {
      console.error('Could not determine Supabase project reference for function call');
      return { 
        success: false, 
        message: 'Invalid Supabase configuration' 
      };
    }
    
    // Construct the proper edge function URL
    const functionUrl = `https://${projectRef}.supabase.co/functions/v1/store-audio`;
    console.log(`Calling edge function at: ${functionUrl}`);
    
    // Get authentication token
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    
    if (!token) {
      console.error('No authentication token available for function call');
      return { 
        success: false, 
        message: 'Authentication required' 
      };
    }
    
    // Make the API call
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        application_id: applicationId
      })
    });
    
    // Parse the response
    if (response.ok) {
      const result = await response.json();
      console.log('Audio retrieval triggered successfully:', result);
      return { 
        success: true, 
        ...result 
      };
    } else {
      const errorText = await response.text();
      console.error('Failed to trigger audio retrieval:', errorText);
      return { 
        success: false, 
        message: `Failed to trigger audio retrieval: ${errorText}` 
      };
    }
  } catch (error) {
    console.error('Error triggering audio retrieval:', error);
    return { 
      success: false, 
      message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
} 