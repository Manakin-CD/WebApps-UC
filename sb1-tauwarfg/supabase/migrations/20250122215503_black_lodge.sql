/*
  # Fix payment date constraint for maquilas table

  1. Changes
    - Remove the restrictive constraint that prevents future payment dates
    - Add a more reasonable constraint that ensures payment date is not before start date
*/

-- First remove the old constraint
ALTER TABLE maquilas
DROP CONSTRAINT IF EXISTS payment_date_not_future;

-- Add new constraint to ensure payment date is not before start date
ALTER TABLE maquilas
ADD CONSTRAINT payment_date_after_start CHECK (
  payment_date IS NULL OR payment_date >= start_date
);