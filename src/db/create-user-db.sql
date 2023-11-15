-- DROP DATABASE IF EXISTS test_db;   
-- CREATE DATABASE IF NOT EXISTS test_db;   
USE test_db; 

DROP TABLE IF EXISTS USERS; 

CREATE TABLE IF NOT EXISTS USERS 
  ( 
     id           INT PRIMARY KEY auto_increment, 
     name         VARCHAR(45) UNIQUE NOT NULL, 
     email        VARCHAR(100) UNIQUE NOT NULL, 
     password     VARCHAR(60) NOT NULL, 
     contact      VARCHAR(45) NOT NULL, 
     refer        VARCHAR(45) NOT NULL, 
     enabled      tinyint(4) NOT NULL DEFAULT 0, 
     role         tinyint(4) NOT NULL DEFAULT 0, 
     created_at   timestamp NOT NULL DEFAULT current_timestamp(),
     timestamp    timestamp NOT NULL DEFAULT current_timestamp()
  );