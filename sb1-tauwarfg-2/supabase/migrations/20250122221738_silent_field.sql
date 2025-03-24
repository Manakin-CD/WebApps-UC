/*
  # Add advance amount to maquilas

  1. Changes
    - Add `advance_amount` column to `maquilas` table
      - Type: numeric(10,2) to handle currency amounts with 2 decimal places
      - Default: 0
      - Not null constraint
      - Check constraint to ensure amount is not negative

  2. Notes
    - Uses numeric type for precise currency calculations
    - Includes validation to prevent negative amounts
*/

ALTER TABLE maquilas
ADD COLUMN IF NOT EXISTS advance_amount numeric(10,2) NOT NULL DEFAULT 0.00
CHECK (advance_amount >= 0);