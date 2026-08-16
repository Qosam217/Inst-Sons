-- ==========================================================
-- Database Schema for Inst Sons (PostgreSQL)
-- ==========================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(256) NOT NULL,
    email VARCHAR(256) UNIQUE NOT NULL,
    password VARCHAR(256) NOT NULL, -- Di-hash menggunakan bcrypt
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Task Histories Table
CREATE TABLE IF NOT EXISTS task_histories (
    id SERIAL PRIMARY KEY,
    module VARCHAR(50) NOT NULL, -- 'pdf_merge', 'pdf_split', 'image_compress', 'yt_download', etc.
    status VARCHAR(20) NOT NULL, -- 'pending', 'processing', 'completed', 'failed'
    file_size_in BIGINT,         -- Dalam bytes
    file_size_out BIGINT,        -- Dalam bytes
    user_id INTEGER,             -- Relasi ke users.id (nullable jika guest)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_task_histories_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_task_histories_user_id ON task_histories(user_id);
CREATE INDEX IF NOT EXISTS idx_task_histories_module ON task_histories(module);
