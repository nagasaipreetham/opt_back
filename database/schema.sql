-- Create database
CREATE DATABASE IF NOT EXISTS optometry_db;
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

-- Insert default admin user (password: admin123)
-- Password hash generated with bcrypt, salt rounds: 10
INSERT INTO patients (name, age, gender, username, password, role, diagnosis, precautions)
VALUES (
  'Admin User',
  30,
  'Male',
  'admin',
  '$2b$10$YourHashedPasswordHere',
  'admin',
  '',
  ''
) ON DUPLICATE KEY UPDATE username=username;

-- Note: You need to generate the actual bcrypt hash for 'admin123'
-- You can use the following Node.js code to generate it:
-- const bcrypt = require('bcrypt');
-- bcrypt.hash('admin123', 10, (err, hash) => console.log(hash));
