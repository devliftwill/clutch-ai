/*
  # Add video screening to applications

  1. Changes
    - Add video_url column to applications table
    - Add video_completed column to track screening completion
    - Add video_completed_at timestamp

  2. Security
    - Maintain existing RLS policies
    - Allow video URL updates
*/

-- Add video screening columns
ALTER TABLE applications
ADD COLUMN video_url text,
ADD COLUMN video_completed boolean DEFAULT false,
ADD COLUMN video_completed_at timestamptz;

-- Update RLS policies to allow video updates
CREATE POLICY "allow_candidates_to_update_video"
ON applications
FOR UPDATE
TO authenticated
USING (
  candidate_id = auth.uid()
)
WITH CHECK (
  candidate_id = auth.uid()
);