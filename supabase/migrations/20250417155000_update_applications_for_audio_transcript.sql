/*
  # Update applications table with audio and transcript columns

  1. Changes
    - Add audio_url column to store the ElevenLabs audio stream URL
    - Add transcript column to store the full conversation transcript
    - Add metadata column to store additional interview data

  2. Security
    - Maintain existing permissions
*/

-- Check if columns exist and add them if not
BEGIN;

-- Add audio_url column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS(SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'applications'
                  AND column_name = 'audio_url') THEN
        ALTER TABLE applications ADD COLUMN audio_url TEXT NULL;
    END IF;
END $$;

-- Add transcript column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS(SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'applications'
                  AND column_name = 'transcript') THEN
        ALTER TABLE applications ADD COLUMN transcript TEXT NULL;
    END IF;
END $$;

-- Add metadata column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS(SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'applications'
                  AND column_name = 'metadata') THEN
        ALTER TABLE applications ADD COLUMN metadata JSONB NULL;
    END IF;
END $$;

COMMIT; 