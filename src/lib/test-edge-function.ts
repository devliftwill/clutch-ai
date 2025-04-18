import { supabase } from './auth';

/**
 * Test function to directly invoke the store-audio edge function
 * This can be used to debug issues with the edge function
 */
export async function testEdgeFunction(applicationId: string) {
  try {
    console.log('🧪 RUNNING EDGE FUNCTION TEST');
    console.log(`Application ID: ${applicationId}`);
    
    // Get authentication token
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      console.error('🔴 No authenticated session');
      return { success: false, error: 'Not authenticated' };
    }
    
    const token = sessionData.session.access_token;
    console.log('🟢 Auth token available');
    
    // Make the API call with hardcoded URL
    const functionUrl = 'https://ycuvndflalyutcmyodgl.supabase.co/functions/v1/store-audio';
    
    console.log(`Calling edge function at: ${functionUrl}`);
    console.log('Request body:', { application_id: applicationId });
    
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
    
    console.log(`Response status: ${response.status} ${response.statusText}`);
    
    // Get response details
    const contentType = response.headers.get('content-type') || '';
    let responseData: any;
    
    if (contentType.includes('application/json')) {
      responseData = await response.json();
      console.log('Response data:', responseData);
    } else {
      const text = await response.text();
      console.log('Response text:', text);
      responseData = { text };
    }
    
    return {
      success: response.ok,
      status: response.status,
      data: responseData
    };
  } catch (error) {
    console.error('🔴 Test error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Check if the application has a conversation_id in the database
 * This helps diagnose if the conversation ID is being properly stored
 */
export async function checkApplicationConversationId(applicationId: string) {
  try {
    console.log('🔍 Checking for conversation_id in application record');
    console.log(`Application ID: ${applicationId}`);
    
    const { data, error } = await supabase
      .from('applications')
      .select('conversation_id')
      .eq('id', applicationId)
      .single();
    
    if (error) {
      console.error('🔴 Error fetching application:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
    
    const hasConversationId = !!data?.conversation_id;
    
    console.log(hasConversationId 
      ? `✅ Application has conversation_id: ${data.conversation_id}` 
      : '❌ Application has NO conversation_id (null)');
    
    return {
      success: true,
      hasConversationId,
      conversationId: data?.conversation_id || null
    };
  } catch (error) {
    console.error('🔴 Check error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      hasConversationId: false
    };
  }
}

// You can call this function directly for debugging:
// testEdgeFunction('your-application-id-here'); 