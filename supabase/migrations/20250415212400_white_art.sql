/*
  # Update applications table RLS policies

  1. Changes
    - Modify RLS policies to properly handle:
      - Public access to application counts
      - Candidate access to own applications
      - Employer access to job applications
    - Remove problematic public policy and implement proper count access

  2. Security
    - Maintain RLS enabled
    - Ensure proper access control for all operations
*/

-- Drop existing policies to recreate them with proper conditions
DROP POLICY IF EXISTS "Candidates can create applications" ON applications;
DROP POLICY IF EXISTS "Candidates can view own applications" ON applications;
DROP POLICY IF EXISTS "Employers can update application status" ON applications;
DROP POLICY IF EXISTS "Employers can view applications for their jobs" ON applications;
DROP POLICY IF EXISTS "Public can view application counts" ON applications;

-- Create updated policies
CREATE POLICY "Candidates can create applications"
ON applications
FOR INSERT
TO authenticated
WITH CHECK (
  candidate_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND account_type = 'candidates'
  )
);

CREATE POLICY "Candidates can view own applications"
ON applications
FOR SELECT
TO authenticated
USING (
  candidate_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND account_type = 'candidates'
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

CREATE POLICY "Employers can update application status"
ON applications
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = applications.job_id
    AND jobs.company_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = applications.job_id
    AND jobs.company_id = auth.uid()
  )
);

-- Create a function to get application count for a job
CREATE OR REPLACE FUNCTION get_job_application_count(job_id uuid)
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COUNT(*)
  FROM applications
  WHERE applications.job_id = $1;
$$;