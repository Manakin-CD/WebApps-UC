/*
  # Agregar sistema de numeración consecutiva para cierres de maquila

  1. Nueva Tabla
    - `closure_counter`: Almacena el contador global de cierres
      - `id` (uuid, primary key)
      - `current_value` (bigint): Valor actual del consecutivo
      - `updated_at` (timestamptz): Última actualización

  2. Modificaciones
    - Agregar columna `consecutive_number` a `maquila_closures`
    
  3. Funciones
    - `get_next_closure_number()`: Obtiene y actualiza el siguiente número consecutivo
*/

-- Crear tabla para el contador
CREATE TABLE IF NOT EXISTS closure_counter (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  current_value bigint NOT NULL DEFAULT 1,
  updated_at timestamptz DEFAULT now()
);

-- Insertar el primer registro si la tabla está vacía
INSERT INTO closure_counter (current_value)
SELECT 1
WHERE NOT EXISTS (SELECT 1 FROM closure_counter);

-- Agregar columna de consecutivo a maquila_closures
ALTER TABLE maquila_closures
ADD COLUMN consecutive_number bigint;

-- Función para obtener el siguiente número
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

-- Trigger para asignar automáticamente el consecutivo
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

CREATE TRIGGER tr_set_closure_consecutive_number
BEFORE INSERT ON maquila_closures
FOR EACH ROW
EXECUTE FUNCTION set_closure_consecutive_number();

-- Habilitar RLS en la nueva tabla
ALTER TABLE closure_counter ENABLE ROW LEVEL SECURITY;

-- Políticas para closure_counter
CREATE POLICY "Public read access"
  ON closure_counter FOR SELECT
  USING (true);

CREATE POLICY "Public update access"
  ON closure_counter FOR UPDATE
  USING (true)
  WITH CHECK (true);