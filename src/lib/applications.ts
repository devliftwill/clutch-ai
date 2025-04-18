import { supabase } from './auth';
import type { Database } from './database.types';

export type Application = Database['public']['Tables']['applications']['Row'] & {
  job?: {
    title: string;
    company?: {
      company_name: string | null;
      avatar_url: string | null;
    } | null;
  } | null;
};

export async function createApplication(
  jobId: string, 
  videoUrl?: string, 
  metadata?: Record<string, any>,
  conversationId?: string | null
) {
  // Get the current user's session
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Prepare the basic application data (only use guaranteed columns)
  const applicationData: any = { 
    job_id: jobId,
    candidate_id: user.id,
    status: 'Applied',
    video_url: videoUrl,
    video_completed: !!videoUrl,
    video_completed_at: videoUrl ? new Date().toISOString() : null
  };
  
  // Add conversation_id if provided
  if (conversationId) {
    console.log(`Including conversation_id in application: ${conversationId}`);
    applicationData.conversation_id = conversationId;
  }

  // Try to create the application using just the basic data first
  try {
    console.log('Creating application with basic data');
    const { data, error } = await supabase
      .from('applications')
      .insert([applicationData])
      .select()
      .single();

    if (error) throw error;
    
    // Once the application is created, we can update it with additional data if needed
    if (metadata && Object.keys(metadata).length > 0) {
      try {
        console.log('Updating application with additional metadata');
        const updateData: any = {};
        
        // Only add fields that might exist
        if (metadata.transcript) {
          updateData.transcript = metadata.transcript;
        }
        
        if (metadata.audio_url) {
          updateData.audio_url = metadata.audio_url;
        }
        
        // Only attempt update if we have fields to update
        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabase
            .from('applications')
            .update(updateData)
            .eq('id', data.id);
            
          if (updateError) {
            console.log('Could not update with additional data, but application was created:', updateError);
          }
        }
      } catch (updateError) {
        console.log('Error updating with additional data, but application was created:', updateError);
      }
    }
    
    return data.id; // Return the application ID
  } catch (insertError: any) {
    console.error('Error creating application:', insertError);
    throw insertError;
  }
}

export async function getApplications() {
  const { data, error } = await supabase
    .from('applications')
    .select(`
      *,
      job:jobs (
        title,
        company:profiles (
          company_name,
          avatar_url
        )
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Application[];
}

export async function checkApplication(jobId: string) {
  const { data, error } = await supabase
    .from('applications')
    .select('id')
    .eq('job_id', jobId)
    .maybeSingle();

  if (error) throw error;
  return data !== null;
}

export async function deleteApplication(id: string) {
  const { error } = await supabase
    .from('applications')
    .delete()
    .match({ id });

  if (error) {
    console.error('Error deleting application:', error);
    throw new Error('Failed to delete application');
  }
}