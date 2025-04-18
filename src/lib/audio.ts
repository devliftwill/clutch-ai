import { supabase } from './auth';

/**
 * Trigger the store-audio edge function to save ElevenLabs conversation audio
 * 
 * @param applicationId The ID of the application to retrieve audio for
 * @param timeRange Optional time range for retrieving audio (last hour if not provided)
 * @returns A promise resolving to the result of the operation
 */
export async function triggerStoreAudio(
  applicationId: string, 
  timeRange?: { from?: string; to?: string }
): Promise<{success: boolean, message?: string}> {
  try {
    console.log(`Triggering store-audio for application: ${applicationId}`);
    
    // Use the specific project URL
    const functionUrl = 'https://ycuvndflalyutcmyodgl.supabase.co/functions/v1/store-audio';
    console.log(`Calling edge function at: ${functionUrl}`);
    
    // Get authentication token
    const { data: sessionData } = await supabase.auth.getSession();
    let token = sessionData.session?.access_token;
    
    if (!token) {
      console.error('No authentication token available for function call');
      
      // Try to refresh the token
      try {
        console.log('Attempting to refresh auth token...');
        const { data: refreshData } = await supabase.auth.refreshSession();
        if (refreshData.session) {
          console.log('Auth token refreshed successfully');
          // Use the refreshed token
          token = refreshData.session.access_token;
        } else {
          return { 
            success: false, 
            message: 'Failed to refresh authentication token' 
          };
        }
      } catch (refreshError) {
        console.error('Failed to refresh token:', refreshError);
        return { 
          success: false, 
          message: 'Authentication required and refresh failed' 
        };
      }
    }
    
    // Prepare request body
    const requestBody: {
      application_id: string;
      time_range?: {
        from: string;
        to: string;
      }
    } = {
      application_id: applicationId
    };
    
    // Add time range if provided, or use default (last hour)
    if (!timeRange) {
      // Default time range: last hour
      const to = new Date().toISOString();
      const from = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
      requestBody.time_range = { from, to };
      console.log('Using default time range (last hour):', requestBody.time_range);
    } else if (timeRange.from && timeRange.to) {
      requestBody.time_range = { 
        from: timeRange.from,
        to: timeRange.to 
      };
      console.log('Using provided time range:', requestBody.time_range);
    }
    
    // Log request details
    console.log('Request body:', JSON.stringify(requestBody));
    
    // Make the API call with retry logic
    let attempts = 0;
    const maxAttempts = 3;
    let response = null;
    
    while (attempts < maxAttempts) {
      attempts++;
      console.log(`Attempt ${attempts}/${maxAttempts} to call edge function`);
      
      try {
        response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(requestBody)
        });
        
        console.log(`Response status: ${response.status} ${response.statusText}`);
        
        // If successful, break out of retry loop
        if (response.ok) break;
        
        // If unauthorized, it won't help to retry
        if (response.status === 401) break;
        
        // Otherwise wait before retrying
        if (attempts < maxAttempts) {
          const waitTime = 1000 * attempts;
          console.log(`Waiting ${waitTime}ms before retrying...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      } catch (fetchError) {
        console.error(`Fetch attempt ${attempts} failed:`, fetchError);
        if (attempts < maxAttempts) {
          const waitTime = 1000 * attempts;
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    // Parse the response
    if (response && response.ok) {
      const result = await response.json();
      console.log('Audio retrieval triggered successfully:', result);
      return { 
        success: true, 
        ...result 
      };
    } else if (response) {
      const contentType = response.headers.get('content-type') || '';
      let errorMessage = '';
      
      if (contentType.includes('application/json')) {
        try {
          const errorJson = await response.json();
          errorMessage = JSON.stringify(errorJson);
          console.error('Error response JSON:', errorJson);
        } catch (e) {
          const errorText = await response.text();
          errorMessage = errorText;
          console.error('Error response text:', errorText);
        }
      } else {
        const errorText = await response.text();
        errorMessage = errorText;
        console.error('Error response text:', errorText);
      }
      
      return { 
        success: false, 
        message: `Failed to trigger audio retrieval (status ${response.status}): ${errorMessage}` 
      };
    } else {
      return {
        success: false,
        message: 'Failed to trigger audio retrieval: No response received after retries'
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