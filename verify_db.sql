-- Quick database verification queries
-- Run these in SQLite to verify your data structure

-- Check if roster table exists and has data
SELECT COUNT(*) as total_roster_entries FROM roster;

-- See all available months in roster
SELECT DISTINCT strftime('%Y-%m', date) as month, COUNT(*) as entries
FROM roster 
GROUP BY month 
ORDER BY month DESC;

-- Check roster entries for a specific employee
SELECT emp_id, date, shift, status 
FROM roster 
WHERE emp_id = (SELECT emp_id FROM employees LIMIT 1)
ORDER BY date;

-- Verify employees table
SELECT COUNT(*) as total_employees FROM employees;

-- Verify shifts table  
SELECT COUNT(*) as total_shifts, 
       SUM(CASE WHEN type = 'full' THEN 1 ELSE 0 END) as full_shifts,
       SUM(CASE WHEN type = 'half' THEN 1 ELSE 0 END) as half_shifts
FROM shifts;

-- Sample query to test the API logic
SELECT DISTINCT strftime('%Y-%m', date) as month 
FROM roster 
ORDER BY month DESC;
