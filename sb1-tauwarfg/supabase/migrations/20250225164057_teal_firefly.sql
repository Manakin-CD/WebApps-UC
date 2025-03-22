/*
  # Remove adelanto column from maquila_closures table

  1. Changes
    - Remove the `adelanto` column from `maquila_closures` table as it's no longer needed
    - The advance amount is now handled at the maquila level
*/

ALTER TABLE maquila_closures DROP COLUMN IF EXISTS adelanto;