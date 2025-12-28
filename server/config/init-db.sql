-- Create the database if it doesn't exist
SELECT 'CREATE DATABASE sql_sandbox'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'sql_sandbox')\gexec

-- Connect to the database
\c sql_sandbox

-- Create a dedicated schema for sandboxed queries
CREATE SCHEMA IF NOT EXISTS sandbox;

-- Create a limited user for the application
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'sandbox_user') THEN
        CREATE USER sandbox_user WITH PASSWORD 'secure_password';
    END IF;
END
$$;

-- Grant necessary privileges
GRANT CONNECT ON DATABASE sql_sandbox TO sandbox_user;
GRANT USAGE ON SCHEMA public, sandbox TO sandbox_user;

-- Create some sample tables in the sandbox schema
-- These will be used for the SQL exercises
CREATE TABLE IF NOT EXISTS sandbox.employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    department VARCHAR(50),
    salary DECIMAL(10, 2),
    hire_date DATE
);

CREATE TABLE IF NOT EXISTS sandbox.departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    location VARCHAR(100),
    budget DECIMAL(15, 2)
);

-- Insert sample data
INSERT INTO sandbox.departments (name, location, budget) VALUES 
('Engineering', 'Building A', 1000000.00),
('Marketing', 'Building B', 500000.00),
('Sales', 'Building C', 750000.00)
ON CONFLICT (name) DO NOTHING;

INSERT INTO sandbox.employees (name, email, department, salary, hire_date) VALUES 
('John Doe', 'john@example.com', 'Engineering', 85000.00, '2020-01-15'),
('Jane Smith', 'jane@example.com', 'Marketing', 75000.00, '2021-03-22'),
('Bob Johnson', 'bob@example.com', 'Sales', 65000.00, '2022-06-10'),
('Alice Williams', 'alice@example.com', 'Engineering', 95000.00, '2019-11-05'),
('Charlie Brown', 'charlie@example.com', 'Marketing', 70000.00, '2022-01-30')
ON CONFLICT (email) DO NOTHING;

-- Create a view for basic employee info
CREATE OR REPLACE VIEW sandbox.employee_info AS
SELECT e.id, e.name, e.email, e.department, d.location, e.hire_date
FROM sandbox.employees e
JOIN sandbox.departments d ON e.department = d.name;

-- Grant read-only access to the sandbox_user
GRANT SELECT ON ALL TABLES IN SCHEMA sandbox TO sandbox_user;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA sandbox TO sandbox_user;
GRANT USAGE ON SCHEMA sandbox TO sandbox_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA sandbox 
GRANT SELECT ON TABLES TO sandbox_user;

-- Create a function to reset the sandbox (for testing)
CREATE OR REPLACE FUNCTION sandbox.reset_sandbox()
RETURNS void AS $$
BEGIN
    -- Truncate all tables in the sandbox schema
    EXECUTE (
        SELECT 'TRUNCATE TABLE ' || 
               string_agg(format('%I.%I', table_schema, table_name), ', ') || ' CASCADE'
        FROM information_schema.tables 
        WHERE table_schema = 'sandbox' 
        AND table_type = 'BASE TABLE'
    );
    
    -- Re-insert sample data
    INSERT INTO sandbox.departments (name, location, budget) VALUES 
    ('Engineering', 'Building A', 1000000.00),
    ('Marketing', 'Building B', 500000.00),
    ('Sales', 'Building C', 750000.00)
    ON CONFLICT (name) DO NOTHING;

    INSERT INTO sandbox.employees (name, email, department, salary, hire_date) VALUES 
    ('John Doe', 'john@example.com', 'Engineering', 85000.00, '2020-01-15'),
    ('Jane Smith', 'jane@example.com', 'Marketing', 75000.00, '2021-03-22'),
    ('Bob Johnson', 'bob@example.com', 'Sales', 65000.00, '2022-06-10'),
    ('Alice Williams', 'alice@example.com', 'Engineering', 95000.00, '2019-11-05'),
    ('Charlie Brown', 'charlie@example.com', 'Marketing', 70000.00, '2022-01-30')
    ON CONFLICT (email) DO NOTHING;
    
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Only allow admins to reset the sandbox
REVOKE ALL ON FUNCTION sandbox.reset_sandbox() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION sandbox.reset_sandbox() TO postgres;
