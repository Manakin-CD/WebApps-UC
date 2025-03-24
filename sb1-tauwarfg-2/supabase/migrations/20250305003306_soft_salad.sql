/*
  # Fix maquila closures consecutive numbers

  1. Changes
    - Add NOT NULL constraint to consecutive_number
    - Add default value using the get_next_closure_number() function
    - Update existing rows without consecutive numbers
*/

-- Update any existing rows that don't have a consecutive number
DO $$
DECLARE
  closure_record RECORD;
BEGIN
  FOR closure_record IN 
    SELECT id 
    FROM maquila_closures 
    WHERE consecutive_number IS NULL
  LOOP
    UPDATE maquila_closures
    SET consecutive_number = get_next_closure_number()
    WHERE id = closure_record.id;
  END LOOP;
END $$;

-- Make consecutive_number NOT NULL and set default
ALTER TABLE maquila_closures
ALTER COLUMN consecutive_number SET NOT NULL,
ALTER COLUMN consecutive_number SET DEFAULT get_next_closure_number();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_maquila_closures_consecutive_number 
ON maquila_closures(consecutive_number);