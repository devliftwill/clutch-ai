-- Create secrets table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add comment to table
COMMENT ON TABLE public.secrets IS 'Secure storage for API keys and other secrets';

-- Add comments to columns
COMMENT ON COLUMN public.secrets.id IS 'Unique identifier for the secret';
COMMENT ON COLUMN public.secrets.name IS 'Name/identifier of the secret';
COMMENT ON COLUMN public.secrets.value IS 'The secret value';
COMMENT ON COLUMN public.secrets.created_at IS 'When the secret was created';
COMMENT ON COLUMN public.secrets.updated_at IS 'When the secret was last updated';

-- Set up RLS
ALTER TABLE public.secrets ENABLE ROW LEVEL SECURITY;

-- Only allow admins to view secrets
CREATE POLICY "Only admins can view secrets" 
ON public.secrets
FOR SELECT 
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'admin'
  )
);

-- Only allow admins to insert secrets
CREATE POLICY "Only admins can insert secrets" 
ON public.secrets
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'admin'
  )
);

-- Only allow admins to update secrets
CREATE POLICY "Only admins can update secrets" 
ON public.secrets
FOR UPDATE 
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'admin'
  )
);

-- Only allow admins to delete secrets
CREATE POLICY "Only admins can delete secrets" 
ON public.secrets
FOR DELETE 
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'admin'
  )
);

-- Add ElevenLabs API key (you'll need to update this with the actual key)
INSERT INTO public.secrets (name, value)
VALUES ('elevenlabs_api_key', 'YOUR_ELEVENLABS_API_KEY_HERE')
ON CONFLICT (name) 
DO UPDATE SET value = EXCLUDED.value, updated_at = now();
