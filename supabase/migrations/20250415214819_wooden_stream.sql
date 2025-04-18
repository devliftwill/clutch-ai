/*
  # Fix Applications RLS Policies

  1. Changes
    - Drop existing policies
    - Create new policies with proper permissions for:
      - Checking application existence
      - Creating applications
      - Viewing applications
      - Updating application status

  2. Security
    - Maintain RLS enabled
    - Ensure proper access control for all operations
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow checking application existence" ON applications;
DROP POLICY IF EXISTS "Candidates can create applications" ON applications;
DROP POLICY IF EXISTS "Candidates can view own applications" ON applications;
DROP POLICY IF EXISTS "Employers can update application status" ON applications;
DROP POLICY IF EXISTS "Employers can view applications for their jobs" ON applications;

-- Create new policies
CREATE POLICY "Allow checking application existence"
ON applications
FOR SELECT
TO authenticated
USING (
  (
    -- Candidates can check their own applications
    candidate_id = auth.uid() AND 
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND account_type = 'candidates'
    )
  ) OR (
    -- Employers can check applications for their jobs
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = applications.job_id
      AND jobs.company_id = auth.uid()
    )
  )
);

CREATE POLICY "Candidates can create applications"
ON applications
FOR INSERT
TO authenticated
WITH CHECK (
  -- Verify the candidate_id matches the authenticated user
  candidate_id = auth.uid() AND
  -- Ensure the user has a candidate profile
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND account_type = 'candidates'
  ) AND
  -- Verify the job is active
  EXISTS (
    SELECT 1 FROM jobs
    WHERE id = job_id
    AND active = true
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