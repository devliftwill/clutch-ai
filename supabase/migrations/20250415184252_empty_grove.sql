/*
  # Add jobs table and industry enum

  1. New Tables
    - `jobs`
      - `id` (uuid, primary key)
      - `title` (text)
      - `company_id` (uuid, references profiles)
      - `type` (text)
      - `location` (text)
      - `overview` (text)
      - `requirements` (text[])
      - `responsibilities` (text[])
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. New Types
    - `industry_type` enum for standardized industry categories

  3. Security
    - Enable RLS on `jobs` table
    - Add policies for job management
*/

-- Create industry enum type
CREATE TYPE industry_type AS ENUM (
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Manufacturing',
  'Retail',
  'Media',
  'Construction',
  'Transportation',
  'Entertainment',
  'Agriculture',
  'Energy',
  'Real Estate',
  'Hospitality',
  'Consulting',
  'Other'
);

-- Modify profiles table to use industry enum
ALTER TABLE profiles
  ALTER COLUMN industry TYPE industry_type USING industry::industry_type;

-- Create jobs table
CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  company_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  location text NOT NULL,
  overview text NOT NULL,
  requirements text[] NOT NULL DEFAULT '{}',
  responsibilities text[] NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Policies for jobs table
CREATE POLICY "Public can view jobs" 
  ON public.jobs
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Employers can manage own jobs" 
  ON public.jobs
  USING (company_id = auth.uid())
  WITH CHECK (company_id = auth.uid());