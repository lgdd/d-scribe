-- Datadog Database Monitoring setup for MySQL
-- This script runs automatically on first container start via docker-entrypoint-initdb.d
-- Reference: https://docs.datadoghq.com/database_monitoring/setup_mysql/selfhosted/

-- Datadog monitoring user
CREATE USER IF NOT EXISTS 'datadog'@'%' IDENTIFIED BY 'datadog';
ALTER USER 'datadog'@'%' WITH MAX_USER_CONNECTIONS 5;

GRANT REPLICATION CLIENT ON *.* TO 'datadog'@'%';
GRANT PROCESS ON *.* TO 'datadog'@'%';
GRANT SELECT ON performance_schema.* TO 'datadog'@'%';

-- Schema for Datadog stored procedures
CREATE SCHEMA IF NOT EXISTS datadog;
GRANT EXECUTE ON datadog.* TO 'datadog'@'%';

-- InnoDB index stats access
GRANT SELECT ON mysql.innodb_index_stats TO 'datadog'@'%';

-- Explain plan procedure (required for query samples)
DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS datadog.explain_statement(IN query TEXT)
    SQL SECURITY DEFINER
BEGIN
    SET @explain := CONCAT('EXPLAIN FORMAT=json ', query);
    PREPARE stmt FROM @explain;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END $$
DELIMITER ;

-- Runtime consumers procedure (enables performance_schema consumers)
DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS datadog.enable_events_statements_consumers()
    SQL SECURITY DEFINER
BEGIN
    UPDATE performance_schema.setup_consumers SET enabled='YES' WHERE name LIKE 'events_statements_%';
    UPDATE performance_schema.setup_consumers SET enabled='YES' WHERE name = 'events_waits_current';
END $$
DELIMITER ;

GRANT EXECUTE ON PROCEDURE datadog.enable_events_statements_consumers TO 'datadog'@'%';

-- Enable performance_schema consumers
UPDATE performance_schema.setup_consumers
  SET ENABLED = 'YES'
  WHERE NAME IN ('events_statements_current', 'events_statements_history', 'events_statements_history_long', 'events_waits_current');

-- Application database and user
CREATE DATABASE IF NOT EXISTS demo;
CREATE USER IF NOT EXISTS 'demo'@'%' IDENTIFIED BY 'demo';
GRANT ALL PRIVILEGES ON demo.* TO 'demo'@'%';

FLUSH PRIVILEGES;

-- Sample tables for DBM demo patterns
USE demo;

CREATE TABLE IF NOT EXISTS parents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS children (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parent_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    FOREIGN KEY (parent_id) REFERENCES parents(id)
);

INSERT INTO parents (name) VALUES ('Parent A'), ('Parent B'), ('Parent C'), ('Parent D'), ('Parent E');
INSERT INTO children (parent_id, name) VALUES
    (1, 'Child 1A'), (1, 'Child 2A'), (1, 'Child 3A'),
    (2, 'Child 1B'), (2, 'Child 2B'),
    (3, 'Child 1C'), (3, 'Child 2C'), (3, 'Child 3C'), (3, 'Child 4C'),
    (4, 'Child 1D'),
    (5, 'Child 1E'), (5, 'Child 2E');
