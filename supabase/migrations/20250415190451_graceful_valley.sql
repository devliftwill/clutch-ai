/*
  # Add additional job details

  1. New Columns
    - `salary_min` (numeric) - Minimum salary amount
    - `salary_max` (numeric) - Maximum salary amount
    - `salary_currency` (text) - Currency code (e.g., CAD, USD)
    - `salary_period` (text) - Pay period (e.g., YEAR, MONTH, HOUR)
    - `experience_level` (text) - Required experience level
    - `benefits` (text[]) - List of job benefits
    - `work_schedule` (text) - Work schedule details

  2. Changes
    - Add new columns with appropriate constraints
    - Set default values where applicable
*/

-- Add salary-related columns
ALTER TABLE public.jobs
ADD COLUMN salary_min numeric,
ADD COLUMN salary_max numeric,
ADD COLUMN salary_currency text NOT NULL DEFAULT 'CAD',
ADD COLUMN salary_period text NOT NULL DEFAULT 'YEAR',
ADD CONSTRAINT salary_range_check CHECK (salary_max >= salary_min);

-- Add experience level
ALTER TABLE public.jobs
ADD COLUMN experience_level text NOT NULL DEFAULT 'Entry Level'
CHECK (experience_level IN ('Entry Level', 'Junior', 'Mid Level', 'Senior', 'Lead', 'Executive'));

-- Add benefits
ALTER TABLE public.jobs
ADD COLUMN benefits text[] NOT NULL DEFAULT '{}';

-- Add work schedule
ALTER TABLE public.jobs
ADD COLUMN work_schedule text NOT NULL DEFAULT 'Full-time';