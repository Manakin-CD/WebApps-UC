/*
  # Update RLS policies for maquilas table

  1. Changes
    - Safely update policies using DO blocks to check existence
    - Ensure idempotent policy creation
    
  2. Security
    - Maintain RLS on maquilas table
    - Update policies for all CRUD operations
*/

DO $$ 
BEGIN
    -- Drop existing policies if they exist
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'maquilas' AND policyname = 'Allow all users to read maquilas') THEN
        DROP POLICY "Allow all users to read maquilas" ON maquilas;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'maquilas' AND policyname = 'Allow all users to insert maquilas') THEN
        DROP POLICY "Allow all users to insert maquilas" ON maquilas;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'maquilas' AND policyname = 'Allow all users to update maquilas') THEN
        DROP POLICY "Allow all users to update maquilas" ON maquilas;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'maquilas' AND policyname = 'Allow all users to delete maquilas') THEN
        DROP POLICY "Allow all users to delete maquilas" ON maquilas;
    END IF;
    
    -- Drop new policy names if they exist
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'maquilas' AND policyname = 'Public read access') THEN
        DROP POLICY "Public read access" ON maquilas;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'maquilas' AND policyname = 'Public insert access') THEN
        DROP POLICY "Public insert access" ON maquilas;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'maquilas' AND policyname = 'Public update access') THEN
        DROP POLICY "Public update access" ON maquilas;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'maquilas' AND policyname = 'Public delete access') THEN
        DROP POLICY "Public delete access" ON maquilas;
    END IF;
END $$;

-- Create new policies
CREATE POLICY "Public read access"
  ON maquilas FOR SELECT
  USING (true);

CREATE POLICY "Public insert access"
  ON maquilas FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public update access"
  ON maquilas FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public delete access"
  ON maquilas FOR DELETE
  USING (true);