/*
  # Fix Closure Tables

  1. Changes
    - Drop and recreate maquila_closures table with all required columns
    - Create closure_counter table with proper structure
    - Set up all necessary triggers and functions
    - Add appropriate RLS policies
*/

-- First, drop existing tables if they exist
DROP TABLE IF EXISTS maquila_closures CASCADE;
DROP TABLE IF EXISTS closure_counter CASCADE;

-- Create closure_counter table
CREATE TABLE closure_counter (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  current_value bigint NOT NULL DEFAULT 1,
  updated_at timestamptz DEFAULT now()
);

-- Insert initial counter value
INSERT INTO closure_counter (current_value) VALUES (1);

-- Create maquila_closures table
CREATE TABLE maquila_closures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  maquila_id uuid NOT NULL REFERENCES maquilas(id) ON DELETE CASCADE,
  consecutive_number bigint NOT NULL,
  tipo text NOT NULL,
  cantidad integer NOT NULL CHECK (cantidad >= 0),
  precio numeric(10,2) NOT NULL CHECK (precio >= 0),
  total numeric(10,2) GENERATED ALWAYS AS (cantidad * precio) STORED,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create function to get next closure number
CREATE OR REPLACE FUNCTION get_next_closure_number()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_value bigint;
BEGIN
  UPDATE closure_counter
  SET current_value = current_value + 1,
      updated_at = now()
  RETURNING current_value INTO next_value;
  
  RETURN next_value;
END;
$$;

-- Create trigger function for consecutive numbers
CREATE OR REPLACE FUNCTION set_closure_consecutive_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.consecutive_number IS NULL THEN
    NEW.consecutive_number = get_next_closure_number();
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for consecutive numbers
CREATE TRIGGER tr_set_closure_consecutive_number
BEFORE INSERT ON maquila_closures
FOR EACH ROW
EXECUTE FUNCTION set_closure_consecutive_number();

-- Create trigger for updated_at
CREATE TRIGGER update_maquila_closures_updated_at
BEFORE UPDATE ON maquila_closures
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create indices for better performance
CREATE INDEX idx_maquila_closures_maquila_id ON maquila_closures(maquila_id);
CREATE INDEX idx_maquila_closures_consecutive ON maquila_closures(consecutive_number);

-- Enable RLS
ALTER TABLE closure_counter ENABLE ROW LEVEL SECURITY;
ALTER TABLE maquila_closures ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for closure_counter
CREATE POLICY "Authenticated read access"
  ON closure_counter FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated update access"
  ON closure_counter FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create RLS policies for maquila_closures
CREATE POLICY "Authenticated read access"
  ON maquila_closures FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated insert access"
  ON maquila_closures FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated update access"
  ON maquila_closures FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated delete access"
  ON maquila_closures FOR DELETE
  TO authenticated
  USING (true);