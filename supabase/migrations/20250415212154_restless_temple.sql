/*
  # Fix Applications RLS Policies

  1. Changes
    - Drop existing RLS policies for applications table
    - Create new comprehensive RLS policies that properly handle:
      - Candidates creating and viewing their own applications
      - Employers viewing applications for their jobs
      - Public access for application counts
  
  2. Security
    - Enable RLS on applications table
    - Add policies for:
      - Application creation by candidates
      - Application viewing by candidates (own applications)
      - Application viewing by employers (for their jobs)
      - Application status updates by employers
      - Public view access for application counts
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Candidates can create applications" ON applications;
DROP POLICY IF EXISTS "Candidates can view own applications" ON applications;
DROP POLICY IF EXISTS "Employers can update application status" ON applications;
DROP POLICY IF EXISTS "Employers can view applications for their jobs" ON applications;
DROP POLICY IF EXISTS "Public can view application counts" ON applications;

-- Re-create policies with proper permissions
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

CREATE POLICY "Public can view application counts"
ON applications
FOR SELECT
TO public
USING (true);