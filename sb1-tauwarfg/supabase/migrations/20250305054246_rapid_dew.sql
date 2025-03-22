-- Drop and recreate the function with improved synchronization
CREATE OR REPLACE FUNCTION get_next_closure_number()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_value bigint;
BEGIN
  -- Lock the table to prevent concurrent access
  LOCK TABLE closure_counter IN SHARE ROW EXCLUSIVE MODE;
  
  -- Get the current value
  SELECT current_value + 1
  INTO next_value
  FROM closure_counter
  LIMIT 1;

  -- Update the counter
  UPDATE closure_counter
  SET current_value = next_value;

  RETURN next_value;
END;
$$;

-- Reset the counter to ensure we start fresh
TRUNCATE TABLE closure_counter;

-- Insert initial value
INSERT INTO closure_counter (current_value) VALUES (0);