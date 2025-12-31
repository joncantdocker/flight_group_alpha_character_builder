-- Initialize the database for Flight Group Alpha
-- This script will be run when the PostgreSQL container starts

-- Create database (will be created automatically by Docker)
-- CREATE DATABASE flight_group_alpha;

-- Create application user with appropriate permissions
-- CREATE USER app_user WITH ENCRYPTED PASSWORD 'app_password';
-- GRANT ALL PRIVILEGES ON DATABASE flight_group_alpha TO app_user;

-- Connect to the database
\c flight_group_alpha;

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Initial tables will be created by SQLAlchemy/Alembic
-- This is just for any initial data or setup

-- Insert some initial data if needed
-- INSERT INTO data_models (title, description, value) 
-- VALUES 
--   ('Sample Data 1', 'This is sample data for testing', 'value1'),
--   ('Sample Data 2', 'Another sample entry', 'value2');