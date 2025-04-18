/*
  # Update storage policies for company logos

  1. Changes
    - Create company-logos bucket if it doesn't exist
    - Drop existing policies if they exist
    - Recreate policies with proper permissions

  2. Security
    - Allow authenticated users to manage their company logos
    - Allow public read access to logos
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload company logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update company logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete company logos" ON storage.objects;
DROP POLICY IF EXISTS "Public can read company logos" ON storage.objects;

-- Create bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Create new policies with proper permissions
CREATE POLICY "Company logo upload policy"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'company-logos');

CREATE POLICY "Company logo update policy"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'company-logos');

CREATE POLICY "Company logo delete policy"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'company-logos');

CREATE POLICY "Company logo read policy"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'company-logos');