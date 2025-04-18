/*
  # Fix storage bucket for candidate videos

  1. Changes
    - Create candidate-videos bucket if it doesn't exist
    - Set up proper storage policies for video uploads
    - Allow authenticated users to upload and view videos

  2. Security
    - Allow full access for authenticated users
*/

-- Create bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('candidate-videos', 'candidate-videos', false)
ON CONFLICT (id) DO NOTHING;

-- Drop any existing policies for this bucket to avoid conflicts
DROP POLICY IF EXISTS "Users can upload interview videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can access their own videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own videos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all interview videos" ON storage.objects;
DROP POLICY IF EXISTS "Recruiters can view candidate videos" ON storage.objects;

-- Allow full access for authenticated users to the candidate-videos bucket
CREATE POLICY "Allow authenticated users to upload candidate videos"
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'candidate-videos');

CREATE POLICY "Allow authenticated users to select candidate videos"
ON storage.objects FOR SELECT 
TO authenticated
USING (bucket_id = 'candidate-videos');

CREATE POLICY "Allow authenticated users to update candidate videos"
ON storage.objects FOR UPDATE 
TO authenticated
USING (bucket_id = 'candidate-videos');

CREATE POLICY "Allow authenticated users to delete candidate videos"
ON storage.objects FOR DELETE 
TO authenticated
USING (bucket_id = 'candidate-videos'); 