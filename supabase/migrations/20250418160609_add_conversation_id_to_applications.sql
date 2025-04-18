-- Add conversation_id column to applications table
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS conversation_id TEXT;

-- Add comment to describe this field
COMMENT ON COLUMN applications.conversation_id IS 'The ElevenLabs conversation ID for the interview';

-- Create index to improve query performance when searching by conversation_id
CREATE INDEX IF NOT EXISTS idx_applications_conversation_id ON applications(conversation_id);
