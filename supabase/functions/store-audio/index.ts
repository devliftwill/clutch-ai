// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

console.log("Hello from Functions!")

// Follow Deno strict typescript rules
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { Resend } from "https://esm.sh/resend";

// Initialize Resend for email
const resend = new Resend("re_6cWrN3Uf_Pbm9dcEwsX6emEdqj1HQTmaC");

// Types for type safety
interface ApplicationData {
  id: string;
  conversation_id: string;
  job_id: string;
  user_id: string;
  created_at: string;
  status: string;
  video_url?: string;
  metadata?: Record<string, any>;
}

interface JobData {
  id: string;
  title: string;
  company_id: string;
  created_at: string;
}

interface ProfileData {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  account_type: string;
}

serve(async (req) => {
  // CORS handling
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    // Get the request JSON
    const { application_id } = await req.json();
    
    if (!application_id) {
      return new Response(
        JSON.stringify({ error: "Missing application_id parameter" }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    console.log(`Processing application ID: ${application_id}`);
    
    // Create Supabase client with admin privileges using service role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    // Get ElevenLabs API key from secrets
    const { data: secretData, error: secretError } = await supabaseAdmin
      .from("secrets")
      .select("value")
      .eq("name", "elevenlabs_api_key")
      .single();
      
    if (secretError || !secretData) {
      console.error("Failed to retrieve ElevenLabs API key:", secretError);
      return new Response(
        JSON.stringify({ error: "Failed to retrieve API credentials" }),
        { 
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    const elevenLabsApiKey = secretData.value;
    
    // 1. Get the application data including conversation_id
    const { data: applicationData, error: applicationError } = await supabaseAdmin
      .from("applications")
      .select("*")
      .eq("id", application_id)
      .single();
      
    if (applicationError || !applicationData) {
      console.error("Failed to retrieve application:", applicationError);
      return new Response(
        JSON.stringify({ error: "Application not found" }),
        { 
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    const application = applicationData as ApplicationData;
    
    // Check if we have a conversation_id
    if (!application.conversation_id) {
      console.error("Application has no conversation_id");
      return new Response(
        JSON.stringify({ error: "Application has no associated conversation" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    console.log(`Found conversation ID: ${application.conversation_id}`);
    
    // 2. Fetch audio from ElevenLabs API
    const elevenLabsResponse = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversations/${application.conversation_id}/audio`,
      {
        method: "GET",
        headers: {
          "xi-api-key": elevenLabsApiKey,
          "Accept": "audio/mpeg"
        }
      }
    );
    
    if (!elevenLabsResponse.ok) {
      console.error(`ElevenLabs API error: ${elevenLabsResponse.status} ${elevenLabsResponse.statusText}`);
      const errorText = await elevenLabsResponse.text();
      console.error(`Error details: ${errorText}`);
      return new Response(
        JSON.stringify({ error: "Failed to retrieve conversation audio" }),
        { 
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    // Get audio as blob
    const audioBlob = await elevenLabsResponse.blob();
    console.log(`Retrieved audio: ${audioBlob.size} bytes`);
    
    // 3. Upload to storage
    const timestamp = Date.now();
    const audioFileName = `interview_audio_${application.user_id}_${timestamp}.mp3`;
    const audioFilePath = `interviews/audio/${audioFileName}`;
    
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("candidate-videos")
      .upload(audioFilePath, audioBlob, {
        contentType: "audio/mpeg",
        cacheControl: "3600",
        upsert: true
      });
      
    if (uploadError) {
      console.error("Audio upload error:", uploadError);
      return new Response(
        JSON.stringify({ error: "Failed to store audio" }),
        { 
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    console.log(`Audio uploaded successfully: ${audioFilePath}`);
    
    // Get the public URL for the audio
    const { data: publicUrlData } = supabaseAdmin.storage
      .from("candidate-videos")
      .getPublicUrl(audioFilePath);
      
    const audioUrl = publicUrlData.publicUrl;
    
    // 4. Update application with audio URL
    let metadata = application.metadata || {};
    if (!metadata.audio_urls) {
      metadata.audio_urls = [];
    }
    metadata.audio_urls.push(audioUrl);
    metadata.audio_url = audioUrl; // Primary audio URL
    
    const { error: updateError } = await supabaseAdmin
      .from("applications")
      .update({
        metadata: metadata
      })
      .eq("id", application_id);
      
    if (updateError) {
      console.error("Failed to update application:", updateError);
      // Continue anyway - we have the audio stored
    }
    
    // 5. Get job details
    const { data: jobData, error: jobError } = await supabaseAdmin
      .from("jobs")
      .select("*")
      .eq("id", application.job_id)
      .single();
      
    if (jobError || !jobData) {
      console.error("Failed to retrieve job details:", jobError);
      // Return success even without the job data - we already have the audio
      return new Response(
        JSON.stringify({ 
          success: true, 
          audioUrl: audioUrl,
          message: "Audio stored but email notification failed (job not found)"
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    const job = jobData as JobData;
    
    // 6. Get company profile for notifications
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", job.company_id)
      .single();
    
    if (profileError || !profileData) {
      console.error("Failed to retrieve company profile:", profileError);
      // Return success even without sending email
      return new Response(
        JSON.stringify({ 
          success: true, 
          audioUrl: audioUrl,
          message: "Audio stored but email notification failed (profile not found)"
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    const profile = profileData as ProfileData;
    
    // 7. Get candidate details for email
    const { data: candidateData, error: candidateError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", application.user_id)
      .single();
      
    const candidateName = candidateData ? 
      `${candidateData.first_name || ''} ${candidateData.last_name || ''}`.trim() : 
      "A candidate";
      
    // 8. Send notification email
    try {
      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Application with Audio</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { padding: 20px 0; border-bottom: 1px solid #eee; }
    .content { padding: 20px 0; }
    .button { display: inline-block; padding: 10px 20px; background-color: #87B440; color: white; text-decoration: none; border-radius: 4px; }
    .footer { padding: 20px 0; border-top: 1px solid #eee; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <h1>New Application with Audio Recording</h1>
  </div>
  <div class="content">
    <p>Hello,</p>
    <p>${candidateName} has completed a video interview for the <strong>${job.title}</strong> position.</p>
    <p>The interview audio is now available for review.</p>
    <p>
      <a href="${audioUrl}" class="button">Listen to Interview Audio</a>
    </p>
    <p>You can also access all application details in your dashboard.</p>
  </div>
  <div class="footer">
    <p>This is an automated message from Clutch AI.</p>
  </div>
</body>
</html>
      `;
      
      const { data: emailData, error: emailError } = await resend.emails.send({
        from: "notifications@clutch-ai.com",
        to: profile.email,
        subject: `New Application for ${job.title} with Audio Recording`,
        html: emailHtml
      });
      
      if (emailError) {
        console.error("Failed to send email:", emailError);
      } else {
        console.log("Email notification sent successfully");
      }
    } catch (emailError) {
      console.error("Error sending email:", emailError);
    }
    
    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        audioUrl: audioUrl 
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
    
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/store-audio' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
