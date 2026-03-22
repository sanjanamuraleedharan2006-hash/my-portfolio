-- Run this in your Supabase SQL Editor to initialize the tables

CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS site_content (
    section_key VARCHAR(100) PRIMARY KEY,
    content TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS skills (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    image_url VARCHAR(255) DEFAULT '',
    code_url VARCHAR(255) DEFAULT '',
    live_url VARCHAR(255) DEFAULT ''
);

-- Insert default content if empty
INSERT INTO site_content (section_key, content) VALUES 
('hero_greeting', 'Hi, I''m'), 
('hero_name', 'Sanjana'), 
('hero_role', 'Web Developer'), 
('hero_description', 'Love creating beautiful websites.'), 
('about_p1', 'CS student.'), 
('about_p2', 'Passionate developer.')
ON CONFLICT (section_key) DO NOTHING;
