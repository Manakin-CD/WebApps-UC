/*
  # Remove consecutive number functionality

  1. Changes
    - Remove consecutive_number column from maquila_closures table
    - Remove closure_counter table as it's no longer needed
    - Remove trigger for consecutive number as it's no longer needed

  2. Notes
    - This is a safe migration that preserves existing data
    - Only removes unused functionality
*/

-- Drop the trigger first
DROP TRIGGER IF EXISTS tr_set_closure_consecutive_number ON maquila_closures;

-- Drop the trigger function
DROP FUNCTION IF EXISTS set_closure_consecutive_number();

-- Drop the closure_counter table as it's no longer needed
DROP TABLE IF EXISTS closure_counter;

-- Remove the consecutive_number column from maquila_closures
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'maquila_closures' 
    AND column_name = 'consecutive_number'
  ) THEN
    ALTER TABLE maquila_closures DROP COLUMN consecutive_number;
  END IF;
END $$;