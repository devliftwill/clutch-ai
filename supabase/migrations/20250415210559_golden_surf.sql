/*
  # Add applications table and related changes

  1. New Tables
    - `applications`
      - `id` (uuid, primary key)
      - `job_id` (uuid, references jobs)
      - `candidate_id` (uuid, references profiles)
      - `status` (text) - Application status (pending, accepted, rejected)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on applications table
    - Add policies for:
      - Candidates to create and view their own applications
      - Employers to view applications for their jobs
*/

-- Create applications table
CREATE TABLE public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  candidate_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(job_id, candidate_id)
);

-- Enable RLS
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Policies for candidates
CREATE POLICY "Candidates can create applications"
  ON public.applications
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
  ON public.applications
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

-- Policies for employers
CREATE POLICY "Employers can view applications for their jobs"
  ON public.applications
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
  ON public.applications
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