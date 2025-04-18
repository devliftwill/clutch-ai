/*
  # Fix Applications RLS Policies

  1. Changes
    - Remove WITH CHECK from SELECT policies
    - Update policies for better access control

  2. Security
    - Enable RLS (already enabled)
    - Update policies to allow:
      - Candidates to view their own applications
      - Employers to view applications for their jobs
      - Public to view application counts
*/

-- Drop existing policies to recreate them with proper permissions
DROP POLICY IF EXISTS "Candidates can view own applications" ON applications;
DROP POLICY IF EXISTS "Employers can view applications for their jobs" ON applications;
DROP POLICY IF EXISTS "Public can view application counts" ON applications;

-- Create updated policies with proper permissions
CREATE POLICY "Candidates can view own applications"
ON applications
FOR SELECT
TO authenticated
USING (
  candidate_id = auth.uid() AND 
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.account_type = 'candidates'
  )
);

CREATE POLICY "Employers can view applications for their jobs"
ON applications
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = applications.job_id 
    AND jobs.company_id = auth.uid()
  )
);

-- Add policy for public application counts (without WITH CHECK)
CREATE POLICY "Public can view application counts"
ON applications
FOR SELECT
TO public
USING (true);

-- Ensure RLS is enabled
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;