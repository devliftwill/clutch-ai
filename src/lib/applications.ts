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

export async function createApplication(jobId: string, videoUrl?: string, metadata?: Record<string, any>) {
  // Get the current user's session
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Prepare the application data
  const applicationData: any = { 
    job_id: jobId,
    candidate_id: user.id,
    status: 'Applied',
    video_url: videoUrl,
    video_completed: !!videoUrl,
    video_completed_at: videoUrl ? new Date().toISOString() : null
  };

  // Add metadata fields if provided
  if (metadata) {
    // Store the transcript if available
    if (metadata.transcript) {
      applicationData.transcript = metadata.transcript;
    }
    
    // Store the audio URL if available
    if (metadata.audio_url) {
      applicationData.audio_url = metadata.audio_url;
    }
    
    // Store any other metadata as JSON in a metadata column if it exists
    if (Object.keys(metadata).length > 0) {
      applicationData.metadata = metadata;
    }
  }

  const { data, error } = await supabase
    .from('applications')
    .insert([applicationData])
    .select()
    .single();

  if (error) throw error;
  return data;
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