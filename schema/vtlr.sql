CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE SCHEMA IF NOT EXISTS vtlr;

DROP TABLE IF EXISTS vtlr.schedule CASCADE;
DROP TABLE IF EXISTS vtlr.task;
DROP TABLE IF EXISTS vtlr.device;

-- Schedule Table
CREATE TABLE vtlr.schedule (
    row_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(64) NOT NULL,
    description TEXT,
    type VARCHAR(32) NOT NULL,
    category VARCHAR(64),
    interval VARCHAR(64) NOT NULL,
    active BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Task Table
CREATE TABLE vtlr.task (
    row_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(64) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(16) NOT NULL,
    text TEXT NOT NULL,
    volume INTEGER NOT NULL,
    language VARCHAR(16) NOT NULL,
    result JSON,
    attemps INTEGER NOT NULL,
    schedule_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_schedule FOREIGN KEY (schedule_id) REFERENCES vtlr.schedule (row_id) ON DELETE CASCADE
);

CREATE TABLE vtlr.device_configuration (
    row_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    device_name VARCHAR(64) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    mac_address VARCHAR(17),
    manufacturer VARCHAR(32),
    model VARCHAR(32),
    volume INTEGER NOT NULL DEFAULT 50,
    last_communication TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT unique_device_ip UNIQUE (device_name, ip_address)
);

-- Indexes and Constraints
CREATE INDEX idx_schedule_title ON vtlr.schedule (title);
CREATE INDEX idx_task_status ON vtlr.task (status);
CREATE INDEX idx_task_schedule_id ON vtlr.task (schedule_id);
