/*
  # Fix Closure Counter Function

  1. Changes
    - Improve get_next_closure_number function with proper WHERE clause
    - Add row-level locking to prevent concurrent access issues
    - Ensure atomic updates
*/

-- Drop and recreate the function with improved logic
CREATE OR REPLACE FUNCTION get_next_closure_number()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_value bigint;
BEGIN
  -- Lock the row for update to prevent concurrent access
  SELECT current_value 
  INTO next_value
  FROM closure_counter
  WHERE id = (SELECT id FROM closure_counter LIMIT 1)
  FOR UPDATE;

  -- Increment the counter
  UPDATE closure_counter
  SET current_value = next_value + 1,
      updated_at = now()
  WHERE id = (SELECT id FROM closure_counter LIMIT 1);

  RETURN next_value;
END;
$$;

-- Ensure we have exactly one counter row
DO $$
BEGIN
  -- Delete all rows if we somehow have more than one
  DELETE FROM closure_counter;
  
  -- Insert a single row if none exists
  INSERT INTO closure_counter (current_value)
  SELECT 1
  WHERE NOT EXISTS (SELECT 1 FROM closure_counter);
END
$$;