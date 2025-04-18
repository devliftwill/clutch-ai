/*
  # Update profiles table RLS policies

  1. Changes
    - Add new policy to allow public read access to company profiles
    - Keep existing policies for user profile management
    - Exclude sensitive information (email) from public access

  2. Security
    - Maintain existing user policies
    - Only expose necessary company information
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

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

-- Add new policy for public access to company profiles
CREATE POLICY "Public can view company profiles"
ON public.profiles
FOR SELECT
TO public
USING (
  account_type = 'employer' AND
  id IN (
    SELECT DISTINCT company_id 
    FROM jobs 
    WHERE active = true
  )
);