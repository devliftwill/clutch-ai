/*
  # Fix Applications RLS Policies

  1. Changes
    - Add new RLS policy to allow checking application existence
    - Policy allows users to check if they've already applied to a job
    - Maintains existing security while enabling necessary functionality

  2. Security
    - Maintains existing RLS policies
    - Adds targeted policy for specific use case
    - Ensures data privacy while enabling required functionality
*/

-- Add new policy to allow checking application existence
CREATE POLICY "Allow checking application existence"
ON public.applications
FOR SELECT
TO authenticated
USING (
  -- Allow users to see if they've applied to a specific job
  candidate_id = auth.uid()
);