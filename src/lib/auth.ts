import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) throw new Error('Missing PUBLIC_SUPABASE_URL');
if (!supabaseAnonKey) throw new Error('Missing PUBLIC_SUPABASE_ANON_KEY');

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export type Profile = Database['public']['Tables']['profiles']['Row'];

export async function signInWithGoogle(accountType: 'candidates' | 'employer') {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
      data: {
        account_type: accountType,
      }
    }
  });

  if (error) throw error;
  return data;
}

export async function signUp(email: string, password: string, data: { 
  full_name: string;
  account_type: 'candidates' | 'employer';
  company_name?: string;
  website?: string;
  industry?: string;
}) {
  const { error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: data.full_name,
        account_type: data.account_type,
        company_name: data.company_name,
        website: data.website,
        industry: data.industry
      }
    }
  });

  if (signUpError) throw signUpError;
}

export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  window.location.href = '/';
}

export async function getProfile(): Promise<Profile | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return profile;
  } catch (error) {
    console.error('Error in getProfile:', error);
    return null;
  }
}

// Function to create a new user and send an invitation
export async function createUserWithInvite(data: {
  email: string;
  full_name: string;
  account_type: 'candidates' | 'employer';
  company_name?: string;
  website?: string;
  industry?: string;
}) {
  try {
    // Generate a temporary random password
    const tempPassword = Math.random().toString(36).slice(-12);

    // Create the user with the temporary password
    const { data: authData, error: signUpError } = await supabase.auth.admin.createUser({
      email: data.email,
      password: tempPassword,
      email_confirm: true, // Auto-confirm the email
      user_metadata: {
        full_name: data.full_name,
        account_type: data.account_type,
        company_name: data.company_name,
        website: data.website,
        industry: data.industry
      }
    });

    if (signUpError) throw signUpError;

    // Send password reset email to let them set their own password
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      data.email,
      {
        redirectTo: `${window.location.origin}/auth/reset-password`
      }
    );

    if (resetError) throw resetError;

    return authData;
  } catch (error) {
    console.error('Error creating user with invite:', error);
    throw error;
  }
}