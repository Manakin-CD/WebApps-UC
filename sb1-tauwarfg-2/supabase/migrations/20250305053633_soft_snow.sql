-- Reset the counter to 0
TRUNCATE TABLE closure_counter;

-- Insert initial value of 0
INSERT INTO closure_counter (current_value) VALUES (0);