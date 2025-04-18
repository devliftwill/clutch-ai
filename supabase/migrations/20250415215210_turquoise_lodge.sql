/*
  # Update Applications Table RLS Policies

  1. Changes
    - Modify RLS policies for applications table to allow proper access
    - Add policy for candidates to view their own applications
    - Add policy for employers to view applications for their jobs
    - Add policy for candidates to create applications
    - Add policy for employers to update application status

  2. Security
    - Ensures candidates can only see their own applications
    - Ensures employers can only see applications for their jobs
    - Ensures candidates can only create applications for themselves
    - Ensures employers can only update applications for their jobs
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow checking application existence" ON applications;
DROP POLICY IF EXISTS "Candidates can create applications" ON applications;
DROP POLICY IF EXISTS "Candidates can view own applications" ON applications;
DROP POLICY IF EXISTS "Employers can update application status" ON applications;
DROP POLICY IF EXISTS "Employers can view applications for their jobs" ON applications;

-- Create new policies
CREATE POLICY "Candidates can view own applications"
ON applications FOR SELECT
TO authenticated
USING (
  candidate_id = auth.uid() AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.account_type = 'candidates'
  )
);

CREATE POLICY "Employers can view job applications"
ON applications FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = applications.job_id
    AND jobs.company_id = auth.uid()
  )
);

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

CREATE POLICY "Employers can update applications"
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