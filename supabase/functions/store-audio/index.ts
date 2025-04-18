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

// Set standardized email sender
const EMAIL_FROM = "noreply@otava.ai";

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
    const { application_id, time_range } = await req.json();
    
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
    if (time_range) {
      console.log(`With time range: ${JSON.stringify(time_range)}`);
    }
    
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
    
    // Use the correct ElevenLabs API key provided by the user
    const elevenLabsApiKey = "sk_3c97af02a0d3bcb16fda806ada7e536113b8ece04b9f1775";
    console.log("Using correct ElevenLabs API key");
    
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
    
    // 2. Fetch audio from ElevenLabs API with time range if provided
    let elevenLabsUrl = `https://api.elevenlabs.io/v1/convai/conversations/${application.conversation_id}/audio`;
    
    // Add time range parameters if provided
    if (time_range && time_range.from && time_range.to) {
      const params = new URLSearchParams();
      params.append('from', time_range.from);
      params.append('to', time_range.to);
      elevenLabsUrl += `?${params.toString()}`;
      console.log(`Using time range parameters: from=${time_range.from}, to=${time_range.to}`);
    }
    
    console.log(`Making request to ElevenLabs API: ${elevenLabsUrl}`);
    
    const elevenLabsResponse = await fetch(
      elevenLabsUrl,
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
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Interview Recording</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f9fafb;
      margin: 0;
      padding: 0;
    }
    
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .email-header {
      background-color: #166A9A;
      padding: 24px;
      text-align: center;
    }
    
    .email-header h1 {
      color: white;
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    
    .email-content {
      padding: 32px 24px;
    }
    
    .candidate-info {
      margin-bottom: 24px;
      padding: 16px;
      background-color: #f2f5f9;
      border-radius: 6px;
    }
    
    .candidate-info p {
      margin: 8px 0;
    }
    
    .highlight {
      font-weight: 600;
      color: #166A9A;
    }
    
    .audio-preview {
      margin: 24px 0;
      padding: 16px;
      background-color: #f2f5f9;
      border-radius: 6px;
      text-align: center;
    }
    
    .button {
      display: inline-block;
      background-color: #166A9A;
      color: white;
      text-decoration: none;
      font-weight: 600;
      padding: 12px 24px;
      border-radius: 6px;
      margin: 8px 0;
      transition: background-color 0.2s ease;
    }
    
    .button:hover {
      background-color: #0d5c8c;
    }
    
    .dash-button {
      display: inline-block;
      background-color: #f2f5f9;
      color: #333;
      text-decoration: none;
      font-weight: 500;
      padding: 12px 24px;
      border-radius: 6px;
      margin: 8px 0;
      transition: background-color 0.2s ease;
    }
    
    .dash-button:hover {
      background-color: #e2e7ef;
    }
    
    .email-footer {
      padding: 16px 24px;
      background-color: #f2f5f9;
      text-align: center;
      font-size: 14px;
      color: #666;
    }
    
    .logo {
      margin-bottom: 16px;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1>New Interview Recording Available</h1>
    </div>
    
    <div class="email-content">
      <p>Hello ${profile.first_name || ''},</p>
      
      <p>A new interview recording is available for your review.</p>
      
      <div class="candidate-info">
        <p><span class="highlight">Candidate:</span> ${candidateName}</p>
        <p><span class="highlight">Position:</span> ${job.title}</p>
        <p><span class="highlight">Application Date:</span> ${new Date(application.created_at).toLocaleDateString()}</p>
      </div>
      
      <div class="audio-preview">
        <p>The interview audio recording has been processed and is ready for review.</p>
        <a href="${audioUrl}" class="button">Listen to Interview Recording</a>
      </div>
      
      <p>You can review all details including the candidate's profile, responses, and analytics in your dashboard.</p>
      
      <div style="text-align: center; margin-top: 24px;">
        <a href="https://app.otava.ai/applications" class="dash-button">View in Dashboard</a>
      </div>
    </div>
    
    <div class="email-footer">
      <p>© ${new Date().getFullYear()} Otava AI. All rights reserved.</p>
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>`;
      
      const { data: emailData, error: emailError } = await resend.emails.send({
        from: EMAIL_FROM,
        to: [profile.email],
        subject: `New Interview Recording: ${candidateName} for ${job.title}`,
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
