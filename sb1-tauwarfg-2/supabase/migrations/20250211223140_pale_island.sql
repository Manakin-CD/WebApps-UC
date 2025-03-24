/*
  # Permitir valores nulos en la fecha de entrega

  1. Cambios
    - Modificar la columna `end_date` en la tabla `maquilas` para permitir valores nulos
    
  2. Razón
    - Permitir que las maquilas se creen sin una fecha de entrega definida
    - Dar más flexibilidad en la gestión de fechas de entrega
*/

ALTER TABLE maquilas
ALTER COLUMN end_date DROP NOT NULL;