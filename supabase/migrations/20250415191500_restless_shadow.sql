-- Enable storage
INSERT INTO storage.buckets (id, name, public) 
VALUES ('company-logos', 'company-logos', true);

-- Set up storage policy to allow authenticated users to upload
CREATE POLICY "Users can upload company logos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'company-logos');

-- Allow users to update their own logos
CREATE POLICY "Users can update own logos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'company-logos' AND auth.uid()::text = (SPLIT_PART(name, '-', 1)));

-- Allow users to delete their own logos
CREATE POLICY "Users can delete own logos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'company-logos' AND auth.uid()::text = (SPLIT_PART(name, '-', 1)));

-- Allow public to read logos
CREATE POLICY "Public can read company logos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'company-logos');