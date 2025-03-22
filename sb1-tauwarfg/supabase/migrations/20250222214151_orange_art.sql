/*
  # Agregar tabla de cierres de maquila

  1. Nueva Tabla
    - `maquila_closures`
      - `id` (uuid, primary key)
      - `maquila_id` (uuid, foreign key)
      - `tipo` (text)
      - `cantidad` (integer)
      - `precio` (numeric)
      - `adelanto` (numeric)
      - `total` (numeric, calculado)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Seguridad
    - Habilitar RLS
    - Agregar políticas para acceso público
*/

-- Create maquila closures table
CREATE TABLE IF NOT EXISTS maquila_closures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  maquila_id uuid NOT NULL REFERENCES maquilas(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  cantidad integer NOT NULL CHECK (cantidad >= 0),
  precio numeric(10,2) NOT NULL CHECK (precio >= 0),
  adelanto numeric(10,2) NOT NULL DEFAULT 0 CHECK (adelanto >= 0),
  total numeric(10,2) GENERATED ALWAYS AS (cantidad * precio) STORED,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE maquila_closures ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public read access"
  ON maquila_closures FOR SELECT
  USING (true);

CREATE POLICY "Public insert access"
  ON maquila_closures FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public update access"
  ON maquila_closures FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public delete access"
  ON maquila_closures FOR DELETE
  USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_maquila_closures_updated_at
  BEFORE UPDATE ON maquila_closures
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create index for faster queries
CREATE INDEX maquila_closures_maquila_id_idx ON maquila_closures(maquila_id);