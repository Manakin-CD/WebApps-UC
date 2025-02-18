/*
  # Add automated status update job

  1. New Function
    - Creates a function to update maquila status based on end date
  2. Scheduled Job
    - Sets up a cron job to run at 6 AM daily
*/

-- Create the function to update maquila status
CREATE OR REPLACE FUNCTION update_maquila_status()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update maquilas where end_date matches current date and status is 'in-progress'
  UPDATE maquilas
  SET status = 'ready'
  WHERE 
    status = 'in-progress' 
    AND end_date = CURRENT_DATE;
END;
$$;

-- Create the cron job to run at 6 AM daily
SELECT cron.schedule(
  'update-maquila-status', -- job name
  '0 6 * * *',            -- cron schedule (6 AM daily)
  'SELECT update_maquila_status();'
);