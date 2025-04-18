/*
  # Simplify Applications Policies
  
  1. Changes
    - Drop all existing complex policies
    - Create simple policies that allow any authenticated user to:
      - Create applications
      - View their own applications
    - Maintain employer policies for viewing/updating applications
    - Remove all candidate-specific checks
  
  2. Security
    - Maintain basic authentication checks
    - Keep employer access controls for their jobs
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "allow_candidates_to_create_applications" ON applications;
DROP POLICY IF EXISTS "allow_candidates_to_view_own_applications" ON applications;
DROP POLICY IF EXISTS "allow_employers_to_view_applications" ON applications;
DROP POLICY IF EXISTS "allow_employers_to_update_applications" ON applications;
DROP POLICY IF EXISTS "Candidates can create applications" ON applications;
DROP POLICY IF EXISTS "Candidates can view own applications" ON applications;
DROP POLICY IF EXISTS "Employers can view applications for their jobs" ON applications;
DROP POLICY IF EXISTS "Employers can update applications" ON applications;
DROP POLICY IF EXISTS "Employers can update application status" ON applications;
DROP POLICY IF EXISTS "Employers can view job applications" ON applications;
DROP POLICY IF EXISTS "Allow checking application existence" ON applications;

-- Create simplified policies
CREATE POLICY "allow_users_to_create_applications"
ON applications FOR INSERT
TO authenticated
WITH CHECK (
  candidate_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = job_id
    AND jobs.active = true
  )
);

CREATE POLICY "allow_users_to_view_own_applications"
ON applications FOR SELECT
TO authenticated
USING (
  candidate_id = auth.uid() OR
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