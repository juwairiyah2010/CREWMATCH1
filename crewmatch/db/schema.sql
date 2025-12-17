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
  google_access_token TEXT,
  google_refresh_token TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  google_event_id VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_time DATETIME,
  end_time DATETIME,
  location VARCHAR(255),
  attendees_count INT,
  html_link TEXT,
  meeting_url TEXT,
  creator VARCHAR(255),
  is_all_day BOOLEAN,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_event (email, google_event_id),
  FOREIGN KEY (email) REFERENCES profiles(email) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS event_invitations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  inviter_email VARCHAR(255) NOT NULL,
  invitee_email VARCHAR(255) NOT NULL,
  status ENUM('pending', 'accepted', 'declined') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (inviter_email) REFERENCES profiles(email) ON DELETE CASCADE,
  FOREIGN KEY (invitee_email) REFERENCES profiles(email) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
