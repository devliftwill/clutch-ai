/*
  # Add active status to jobs table

  1. Changes
    - Add `active` boolean column to jobs table with default true
    - Update jobs table policies to respect active status
    - Add index on active column for better query performance

  2. Security
    - Maintain existing RLS policies
    - Add active status check to public view policy
*/

-- Add active column
ALTER TABLE public.jobs
ADD COLUMN active boolean NOT NULL DEFAULT true;

-- Add index for better performance
CREATE INDEX jobs_active_idx ON public.jobs(active);

-- Update public view policy to only show active jobs
DROP POLICY IF EXISTS "Public can view jobs" ON public.jobs;
CREATE POLICY "Public can view jobs" 
  ON public.jobs
  FOR SELECT
  TO public
  USING (active = true);

-- Employers can still see all their jobs regardless of status
DROP POLICY IF EXISTS "Employers can manage own jobs" ON public.jobs;
CREATE POLICY "Employers can manage own jobs" 
  ON public.jobs
  USING (company_id = auth.uid())
  WITH CHECK (company_id = auth.uid());