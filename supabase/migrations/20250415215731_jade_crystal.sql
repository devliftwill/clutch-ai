/*
  # Remove duplicate application check

  1. Changes
    - Drop unique constraint on job_id and candidate_id
    - Update policies to allow multiple applications

  2. Security
    - Maintain existing RLS policies
    - Keep candidate and employer role checks
*/

-- Drop the unique constraint
ALTER TABLE applications
DROP CONSTRAINT IF EXISTS applications_job_id_candidate_id_key;

-- Drop existing policies
DROP POLICY IF EXISTS "Candidates can create applications" ON applications;
DROP POLICY IF EXISTS "Candidates can view own applications" ON applications;
DROP POLICY IF EXISTS "Employers can view applications for their jobs" ON applications;
DROP POLICY IF EXISTS "Employers can update application status" ON applications;

-- Create updated policies
CREATE POLICY "Candidates can create applications"
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

CREATE POLICY "Candidates can view own applications"
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

CREATE POLICY "Employers can view applications for their jobs"
ON applications FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = applications.job_id
    AND jobs.company_id = auth.uid()
  )
);

CREATE POLICY "Employers can update application status"
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