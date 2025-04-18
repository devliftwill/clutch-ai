/*
  # Fix Applications RLS Policies

  1. Changes
    - Drop all existing policies
    - Recreate policies with correct permissions
    - Ensure unique policy names
    - Remove unique constraint on job_id and candidate_id

  2. Security
    - Enable RLS
    - Add proper checks for candidate and employer roles
*/

-- Drop the unique constraint if it exists
ALTER TABLE applications
DROP CONSTRAINT IF EXISTS applications_job_id_candidate_id_key;

-- Drop all existing policies
DROP POLICY IF EXISTS "Candidates can create applications" ON applications;
DROP POLICY IF EXISTS "Candidates can view own applications" ON applications;
DROP POLICY IF EXISTS "Employers can view applications for their jobs" ON applications;
DROP POLICY IF EXISTS "Employers can update applications" ON applications;
DROP POLICY IF EXISTS "Employers can update application status" ON applications;
DROP POLICY IF EXISTS "Employers can view job applications" ON applications;
DROP POLICY IF EXISTS "Allow checking application existence" ON applications;

-- Create new policies with unique names
CREATE POLICY "allow_candidates_to_create_applications"
ON applications FOR INSERT
TO authenticated
WITH CHECK (
  candidate_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.account_type = 'candidates'
  ) AND
  EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = job_id
    AND jobs.active = true
  )
);

CREATE POLICY "allow_candidates_to_view_own_applications"
ON applications FOR SELECT
TO authenticated
USING (
  candidate_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND account_type = 'candidates'
  )
);

CREATE POLICY "allow_employers_to_view_applications"
ON applications FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = applications.job_id
    AND jobs.company_id = auth.uid()
  )
);

CREATE POLICY "allow_employers_to_update_applications"
ON applications FOR UPDATE
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