import { createClient } from 'npm:@supabase/supabase-js@2.39.8';
import { corsHeaders } from '../_shared/cors.ts';

interface CreateJobPostingPayload {
  user: {
    email: string;
    full_name: string;
    account_type: 'employer';
    company_name: string;
    website?: string;
    industry?: string;
  };
  job: {
    title: string;
    type: string;
    location: string;
    overview: string;
    requirements: string[];
    responsibilities: string[];
    salary_min?: number;
    salary_max?: number;
    salary_currency?: string;
    salary_period?: string;
    experience_level: string;
    benefits?: string[];
    work_schedule?: string;
  };
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    // Get the request body
    const payload: CreateJobPostingPayload = await req.json();

    // Validate required fields
    if (!payload.user?.email || !payload.user?.full_name || !payload.user?.company_name) {
      throw new Error('Missing required user fields');
    }

    if (!payload.job?.title || !payload.job?.type || !payload.job?.location || !payload.job?.overview) {
      throw new Error('Missing required job fields');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', payload.user.email)
      .single();

    let userId: string;

    if (!existingUser) {
      // Create new user with temporary password
      const tempPassword = Math.random().toString(36).slice(-12);
      
      const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
        email: payload.user.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: payload.user.full_name,
          account_type: 'employer',
          company_name: payload.user.company_name,
          website: payload.user.website,
          industry: payload.user.industry
        }
      });

      if (createUserError) throw createUserError;
      if (!newUser.user) throw new Error('Failed to create user');

      userId = newUser.user.id;

      // Send password reset email
      const { error: resetError } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: payload.user.email
      });

      if (resetError) throw resetError;
    } else {
      userId = existingUser.id;
    }

    // Create job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert([{
        ...payload.job,
        company_id: userId,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (jobError) throw jobError;

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          job,
          isNewUser: !existingUser
        }
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200
      }
    );

  } catch (error) {
    // Return error response
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      }
    );
  }
});