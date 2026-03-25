-- Add download_file_name column to copybooks table
ALTER TABLE copybooks
  ADD COLUMN IF NOT EXISTS download_file_name TEXT;
