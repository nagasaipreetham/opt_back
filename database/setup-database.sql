-- Run this file as root user to setup database and permissions
-- Command: mysql -u root -p < backend/database/setup-database.sql

-- Create database
CREATE DATABASE IF NOT EXISTS optometry_db;

-- Grant all privileges to user 'sai'
GRANT ALL PRIVILEGES ON optometry_db.* TO 'sai'@'localhost';

-- If user 'sai' doesn't exist, create it
CREATE USER IF NOT EXISTS 'sai'@'localhost' IDENTIFIED BY 'SAIKIRAN';

-- Grant privileges again to ensure
GRANT ALL PRIVILEGES ON optometry_db.* TO 'sai'@'localhost';

-- Flush privileges to apply changes
FLUSH PRIVILEGES;

-- Use the database
USE optometry_db;

-- Create patients table
CREATE TABLE IF NOT EXISTS patients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  age INT NOT NULL,
  gender ENUM('Male', 'Female', 'Other') NOT NULL,
  diagnosis TEXT,
  precautions TEXT,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'patient') DEFAULT 'patient',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  filename VARCHAR(255) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  INDEX idx_patient_id (patient_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Show success message
SELECT 'Database setup completed successfully!' AS Status;
