CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE SCHEMA IF NOT EXISTS vtlr;

DROP TABLE IF EXISTS vtlr.schedules CASCADE;
DROP TABLE IF EXISTS vtlr.users CASCADE;
DROP TABLE IF EXISTS vtlr.user_devices;

-- Schedules Table
CREATE TABLE vtlr.schedules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(128) NOT NULL,
    description TEXT,
    schedule_config JSONB NOT NULL,
    action_config JSONB NOT NULL,
    active BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Users Table
CREATE TABLE vtlr.users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- User devices Table
CREATE TABLE vtlr.user_devices(
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL,
    device_name VARCHAR(64) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    mac_address VARCHAR(17),
    manufacturer VARCHAR(32),
    model VARCHAR(32),
    volume INTEGER NOT NULL DEFAULT 50,
    last_communication TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT unique_device_ip UNIQUE (device_name, ip_address),
    CONSTRAINT user_devices_user_id_fkey FOREIGN KEY (user_id) REFERENCES vtlr.users(id) ON DELETE CASCADE
);

-- Indexes and Constraints
CREATE INDEX idx_schedule_title ON vtlr.schedules (title);
CREATE INDEX idx_user_devices_user_id ON vtlr.user_devices(user_id);

-- Create root user
INSERT INTO vtlr.users (username, password, role)
VALUES ('admin', crypt('admin', gen_salt('bf')), 'admin')
ON CONFLICT (username) DO NOTHING;
