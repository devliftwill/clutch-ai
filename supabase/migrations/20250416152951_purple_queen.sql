/*
  # Fix Application Deletion Policies

  1. Changes
    - Add DELETE policy for applications table
    - Allow candidates to delete their own applications
    - Allow employers to delete applications for their jobs

  2. Security
    - Ensure proper authentication checks
    - Maintain existing RLS policies
*/

-- Drop existing delete policies if they exist
DROP POLICY IF EXISTS "allow_candidates_to_delete_applications" ON applications;
DROP POLICY IF EXISTS "allow_employers_to_delete_applications" ON applications;

-- Create new delete policies
CREATE POLICY "allow_candidates_to_delete_applications"
ON applications FOR DELETE
TO authenticated
USING (
  candidate_id = auth.uid()
);

CREATE POLICY "allow_employers_to_delete_applications"
ON applications FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = applications.job_id
    AND jobs.company_id = auth.uid()
  )
);