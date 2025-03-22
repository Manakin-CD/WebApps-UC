/*
  # Corregir tabla de cierres de maquila

  1. Cambios
    - Agregar restricción NOT NULL a campos requeridos
    - Agregar índices para mejorar el rendimiento
    - Agregar restricciones de integridad referencial
    - Actualizar políticas de RLS

  2. Seguridad
    - Actualizar políticas para garantizar acceso correcto
*/

-- Asegurar que los campos requeridos sean NOT NULL
ALTER TABLE maquila_closures
ALTER COLUMN tipo SET NOT NULL,
ALTER COLUMN cantidad SET NOT NULL,
ALTER COLUMN precio SET NOT NULL;

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_maquila_closures_maquila_id ON maquila_closures(maquila_id);
CREATE INDEX IF NOT EXISTS idx_maquila_closures_consecutive ON maquila_closures(consecutive_number);

-- Asegurar que la referencia a maquilas tenga la restricción correcta
ALTER TABLE maquila_closures
DROP CONSTRAINT IF EXISTS maquila_closures_maquila_id_fkey,
ADD CONSTRAINT maquila_closures_maquila_id_fkey 
  FOREIGN KEY (maquila_id) 
  REFERENCES maquilas(id) 
  ON DELETE CASCADE;

-- Actualizar las políticas de RLS
DROP POLICY IF EXISTS "Public read access" ON maquila_closures;
DROP POLICY IF EXISTS "Public insert access" ON maquila_closures;
DROP POLICY IF EXISTS "Public update access" ON maquila_closures;
DROP POLICY IF EXISTS "Public delete access" ON maquila_closures;

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

-- Asegurar que el trigger de consecutivo existe y funciona correctamente
DROP TRIGGER IF EXISTS tr_set_closure_consecutive_number ON maquila_closures;

CREATE TRIGGER tr_set_closure_consecutive_number
  BEFORE INSERT ON maquila_closures
  FOR EACH ROW
  EXECUTE FUNCTION set_closure_consecutive_number();