/*
  # Add full-text search capabilities to jobs table

  1. Changes
    - Add full-text search index on jobs table
    - Create GIN index for better search performance
    - Add tsvector column for title search

  2. Security
    - Maintain existing RLS policies
*/

-- Add tsvector column for title search
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS title_search tsvector
GENERATED ALWAYS AS (to_tsvector('english', title)) STORED;

-- Create GIN index for faster full-text search
CREATE INDEX IF NOT EXISTS jobs_title_search_idx
ON jobs USING GIN (title_search);