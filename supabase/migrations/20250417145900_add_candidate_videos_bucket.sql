/*
  # Add candidate-videos storage bucket

  1. Changes
    - Create candidate-videos storage bucket
    - Set up storage policies for video uploads
    - Allow authenticated users to upload and manage their videos

  2. Security
    - Enable authenticated users to upload their own interview videos
    - Allow authenticated users to view their own videos
    - Allow company/admin users to view candidate videos
*/

-- Create bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('candidate-videos', 'candidate-videos', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload videos
CREATE POLICY "Users can upload interview videos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'candidate-videos'
);

-- Allow authenticated users to access their own videos
CREATE POLICY "Users can access their own videos"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'candidate-videos' AND
  (auth.uid()::text = SUBSTRING(name FROM 'interview_([^_]+)') OR
   auth.uid()::text = SPLIT_PART(REPLACE(name, 'interviews/', ''), '_', 2))
);

-- Allow authenticated users to update their own videos
CREATE POLICY "Users can update their own videos"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'candidate-videos' AND
  (auth.uid()::text = SUBSTRING(name FROM 'interview_([^_]+)') OR
   auth.uid()::text = SPLIT_PART(REPLACE(name, 'interviews/', ''), '_', 2))
);

-- Allow authenticated users to delete their own videos
CREATE POLICY "Users can delete their own videos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'candidate-videos' AND
  (auth.uid()::text = SUBSTRING(name FROM 'interview_([^_]+)') OR
   auth.uid()::text = SPLIT_PART(REPLACE(name, 'interviews/', ''), '_', 2))
);

-- Allow admins to view all videos (you may need to adjust this based on your user roles)
CREATE POLICY "Admins can view all interview videos"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'candidate-videos' AND
  auth.uid() IN (
    SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
  )
);

-- Allow recruiters to view candidate videos
CREATE POLICY "Recruiters can view candidate videos"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'candidate-videos' AND
  auth.uid() IN (
    SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'recruiter'
  )
); 