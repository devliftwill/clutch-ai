/*
  # Fix Applications RLS Policies

  1. Changes
    - Drop existing RLS policies for applications table
    - Create new policies that properly handle:
      - Application creation by authenticated users
      - Viewing applications (both for candidates and employers)
      - Updating application status by employers

  2. Security
    - Enable RLS on applications table
    - Add policies to ensure:
      - Candidates can only create applications for active jobs
      - Candidates can only view their own applications
      - Employers can only view applications for their jobs
      - Employers can only update applications for their jobs
*/

-- Drop existing policies
DROP POLICY IF EXISTS "allow_users_to_create_applications" ON applications;
DROP POLICY IF EXISTS "allow_users_to_view_own_applications" ON applications;
DROP POLICY IF EXISTS "allow_employers_to_update_applications" ON applications;

-- Create new policies
CREATE POLICY "candidates_can_create_applications"
ON applications FOR INSERT
TO authenticated
WITH CHECK (
  -- Ensure candidate_id matches the authenticated user
  candidate_id = auth.uid() AND
  -- Verify the job exists and is active
  EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = job_id
    AND jobs.active = true
  )
);

CREATE POLICY "users_can_view_own_applications"
ON applications FOR SELECT
TO authenticated
USING (
  -- Candidates can view their own applications
  candidate_id = auth.uid() OR
  -- Employers can view applications for their jobs
  EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = job_id
    AND jobs.company_id = auth.uid()
  )
);

CREATE POLICY "employers_can_update_applications"
ON applications FOR UPDATE
TO authenticated
USING (
  -- Verify the user is the employer who posted the job
  EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = job_id
    AND jobs.company_id = auth.uid()
  )
)
WITH CHECK (
  -- Same condition for the new row
  EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = job_id
    AND jobs.company_id = auth.uid()
  )
);