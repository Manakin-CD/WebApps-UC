/*
  # Create maquilas table

  1. New Tables
    - `maquilas`
      - `id` (uuid, primary key)
      - `name` (text)
      - `capacity` (integer)
      - `assigned_pieces` (integer)
      - `start_date` (date)
      - `end_date` (date)
      - `status` (enum)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `maquilas` table
    - Add policies for authenticated users to perform CRUD operations
*/

-- Create enum type for maquila status
CREATE TYPE maquila_status AS ENUM (
  'available',
  'in-progress',
  'near-deadline',
  'ready',
  'overdue'
);

-- Create maquilas table
CREATE TABLE IF NOT EXISTS maquilas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  capacity integer NOT NULL CHECK (capacity >= 0),
  assigned_pieces integer NOT NULL DEFAULT 0 CHECK (assigned_pieces >= 0),
  start_date date NOT NULL,
  end_date date NOT NULL,
  status maquila_status NOT NULL DEFAULT 'available',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT assigned_pieces_within_capacity CHECK (assigned_pieces <= capacity)
);

-- Enable RLS
ALTER TABLE maquilas ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all users to read maquilas"
  ON maquilas
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow all users to insert maquilas"
  ON maquilas
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow all users to update maquilas"
  ON maquilas
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all users to delete maquilas"
  ON maquilas
  FOR DELETE
  TO authenticated
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to update updated_at
CREATE TRIGGER update_maquilas_updated_at
  BEFORE UPDATE ON maquilas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();