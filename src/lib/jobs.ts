import { createClient, PostgrestError, PostgrestSingleResponse, PostgrestResponse } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please ensure PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY are set in your .env file.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Utility function that adds a timeout to any promise
export function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutError = new Error('Request timed out')): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => {
      console.error(`Supabase request timed out after ${timeoutMs}ms`);
      reject(timeoutError);
    }, timeoutMs);
  });

  return Promise.race([promise, timeout]);
}

// Helper to refresh auth token - can be called before critical operations
export async function refreshAuthToken() {
  try {
    console.log('Attempting to refresh Supabase auth token');
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      console.error('Error refreshing auth token:', error);
      // Clear problematic auth state
      await supabase.auth.signOut();
      return false;
    }
    
    console.log('Auth token refreshed successfully');
    return true;
  } catch (err) {
    console.error('Exception during auth token refresh:', err);
    return false;
  }
}

export type Job = Database['public']['Tables']['jobs']['Row'] & {
  company?: {
    company_name: string | null;
    website: string | null;
    industry: string | null;
    avatar_url: string | null;
  } | null;
};

type JobFilters = {
  types: string[];
  experienceLevels: string[];
  workSchedules: string[];
  location?: string;
};

const PAGE_SIZE = 10;
const QUERY_TIMEOUT = 8000; // 8 seconds timeout for queries

export async function getLocations() {
  try {
    // Refresh token if user is logged in
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) await refreshAuthToken();
    } catch (e) {
      console.warn("Couldn't check auth session:", e);
    }

    const query = supabase
      .from('jobs')
      .select('location')
      .eq('active', true)
      .order('location');

    // Type-safe timeout function
    const result = await withTimeout<PostgrestResponse<{location: string}>>(
      query as unknown as Promise<PostgrestResponse<{location: string}>>, 
      QUERY_TIMEOUT
    );
    
    const { data, error } = result;

    if (error) throw error;

    // Get unique locations
    const uniqueLocations = Array.from(new Set(data.map((job: {location: string}) => job.location)));
    return uniqueLocations;
  } catch (error) {
    console.error('Error fetching locations:', error);
    return [];
  }
}

export async function getJobs(searchQuery?: string, filters?: JobFilters, page: number = 0) {
  console.log('getJobs called with:', { searchQuery, filters, page });
  try {
    // Refresh token if user is logged in
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) await refreshAuthToken();
    } catch (e) {
      console.warn("Couldn't check auth session:", e);
    }

    let query = supabase
      .from('jobs')
      .select(`
        *,
        company:profiles!jobs_company_id_fkey (
          company_name,
          website,
          industry,
          avatar_url
        )
      `)
      .eq('active', true)
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    // Add full-text search if query is provided
    if (searchQuery) {
      query = query.textSearch('title_search', searchQuery, {
        type: 'websearch',
        config: 'english'
      });
    }

    // Apply filters if they exist
    if (filters) {
      if (filters.types?.length > 0) {
        query = query.in('type', filters.types);
      }

      if (filters.experienceLevels?.length > 0) {
        query = query.in('experience_level', filters.experienceLevels);
      }

      if (filters.workSchedules?.length > 0) {
        query = query.in('work_schedule', filters.workSchedules);
      }

      // Only apply location filter if it's not "all"
      if (filters.location && filters.location !== 'all') {
        query = query.eq('location', filters.location);
      }
    }

    console.log('Executing Supabase query with timeout...');
    // Type-safe timeout function
    const result = await withTimeout<PostgrestResponse<Job>>(
      query as unknown as Promise<PostgrestResponse<Job>>, 
      QUERY_TIMEOUT
    );
    
    const { data, error, count } = result;
    console.log('Query completed');

    if (error) {
      console.error('Supabase error in getJobs:', error);
      
      // If auth error, try signing out to clear bad state
      if (error.code === 'PGRST301' || error.message?.includes('JWT')) {
        console.warn('JWT auth error detected, signing out');
        await supabase.auth.signOut();
      }
      
      throw new Error(`Failed to fetch jobs: ${error.message}`);
    }

    console.log(`getJobs success: fetched ${data?.length || 0} jobs`);
    return {
      jobs: data || [],
      hasMore: (data?.length || 0) === PAGE_SIZE
    };
  } catch (error) {
    console.error('Error in getJobs:', error);
    
    // If timeout error, try signing out
    if (error instanceof Error && error.message === 'Request timed out') {
      console.warn('Query timeout, signing out to clear potential bad auth state');
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error('Error during emergency signout:', e);
      }
    }
    
    // Return empty array instead of throwing to avoid breaking the UI
    return {
      jobs: [],
      hasMore: false
    };
  }
}

export async function getJob(id: string) {
  try {
    if (!id) {
      throw new Error('Job ID is required');
    }

    // Refresh token if user is logged in
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) await refreshAuthToken();
    } catch (e) {
      console.warn("Couldn't check auth session:", e);
    }

    const query = supabase
      .from('jobs')
      .select(`
        *,
        company:profiles!jobs_company_id_fkey (
          company_name,
          website,
          industry,
          avatar_url
        )
      `)
      .eq('id', id)
      .eq('active', true)
      .single();

    console.log('Executing single job query with timeout...');
    // Type-safe timeout function
    const result = await withTimeout<PostgrestSingleResponse<Job>>(
      query as unknown as Promise<PostgrestSingleResponse<Job>>, 
      QUERY_TIMEOUT
    );
    
    const { data, error } = result;
    console.log('Single job query completed');

    if (error) {
      console.error('Supabase error:', error);
      
      // If auth error, try signing out to clear bad state
      if (error.code === 'PGRST301' || error.message?.includes('JWT')) {
        console.warn('JWT auth error detected, signing out');
        await supabase.auth.signOut();
      }
      
      throw new Error(`Failed to fetch job: ${error.message}`);
    }

    if (!data) {
      throw new Error('Job not found');
    }

    return data;
  } catch (error) {
    console.error('Error fetching job:', error);
    
    // If timeout error, try signing out
    if (error instanceof Error && error.message === 'Request timed out') {
      console.warn('Query timeout, signing out to clear potential bad auth state');
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error('Error during emergency signout:', e);
      }
    }
    
    throw error;
  }
}