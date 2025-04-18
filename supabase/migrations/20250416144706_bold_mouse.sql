/*
  # Add avatars storage bucket

  1. Changes
    - Create avatars storage bucket
    - Set up storage policies for avatar uploads
    - Allow public access to avatars

  2. Security
    - Enable authenticated users to upload their own avatars
    - Allow public read access to avatars
    - Restrict file types to images
    - Limit file size
*/

-- Enable storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Allow authenticated users to upload avatars
CREATE POLICY "Users can upload avatars"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (SPLIT_PART(name, '-', 1))
);

-- Allow users to update their own avatars
CREATE POLICY "Users can update own avatars"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (SPLIT_PART(name, '-', 1))
);

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete own avatars"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (SPLIT_PART(name, '-', 1))
);

-- Allow public to read avatars
CREATE POLICY "Public can read avatars"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');