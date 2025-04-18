/*
  # Add Qualified status to applications

  1. Changes
    - Update applications status check constraint to include 'Qualified'
    - Maintain existing statuses: 'Applied', 'Interview', 'Rejected'

  2. Security
    - Maintain existing RLS policies
*/

-- Update the status check constraint
ALTER TABLE applications
DROP CONSTRAINT IF EXISTS applications_status_check;

ALTER TABLE applications
ADD CONSTRAINT applications_status_check 
CHECK (status = ANY (ARRAY['Applied', 'Qualified', 'Interview', 'Rejected']));