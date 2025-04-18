/*
  # Fix Applications RLS Policies

  1. Changes
    - Update INSERT policy for applications table to properly handle job applications
    - Ensure candidates can only apply to active jobs
    - Verify candidate profile type check
  
  2. Security
    - Maintain existing SELECT policies
    - Ensure proper authentication checks
    - Verify account type restrictions
*/

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Candidates can create applications" ON applications;

-- Create new INSERT policy with proper checks
CREATE POLICY "Candidates can create applications" ON applications
FOR INSERT TO authenticated
WITH CHECK (
  -- Verify the candidate_id matches the authenticated user
  candidate_id = auth.uid() 
  AND
  -- Ensure the user has a candidate profile
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND account_type = 'candidates'
  )
  AND
  -- Verify the job is active
  EXISTS (
    SELECT 1 FROM jobs
    WHERE id = job_id
    AND active = true
  )
);