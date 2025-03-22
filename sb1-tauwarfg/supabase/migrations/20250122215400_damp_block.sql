/*
  # Add payment date to maquilas table

  1. Changes
    - Add payment_date column to maquilas table
    - Set default value to NULL to indicate unpaid status
    - Add check constraint to ensure payment_date is not in the future
*/

ALTER TABLE maquilas
ADD COLUMN IF NOT EXISTS payment_date date DEFAULT NULL;

-- Add check constraint to ensure payment_date is not in the future
ALTER TABLE maquilas
ADD CONSTRAINT payment_date_not_future CHECK (payment_date IS NULL OR payment_date <= CURRENT_DATE);