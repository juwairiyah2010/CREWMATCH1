-- MySQL schema for CrewMatch
-- Run these statements in your MySQL database to create the database and table.

CREATE DATABASE IF NOT EXISTS crewmatch CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE crewmatch;

CREATE TABLE IF NOT EXISTS profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  fullName VARCHAR(255) NOT NULL,
  branch VARCHAR(100),
  skills JSON,
  traits JSON,
  goal VARCHAR(100),
  bio TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
