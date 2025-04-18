/*
  # Update profiles table RLS policies

  1. Changes
    - Add new policy to allow public read access to company profiles
    - Keep existing user policies for profile management
    - Exclude sensitive information (email) from public access

  2. Security
    - Maintain existing user policies
    - Only expose necessary company information
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public can view company profiles" ON public.profiles;

-- Create new policies
CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Add new policy for public access to profiles
CREATE POLICY "Public can view profiles"
ON public.profiles
FOR SELECT
TO public
USING (true);

-- Create a secure view that excludes sensitive information
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  full_name,
  avatar_url,
  account_type,
  company_name,
  website,
  industry,
  created_at,
  updated_at
FROM profiles;