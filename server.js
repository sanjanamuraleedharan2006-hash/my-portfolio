const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the current directory
app.use(express.static(path.join(__dirname)));

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '';

let supabase = null;
if (supabaseUrl && supabaseKey) {
    try {
        console.log('Initializing Supabase client...');
        supabase = createClient(supabaseUrl, supabaseKey);
    } catch (err) {
        console.error('CRITICAL: Failed to create Supabase client:', err.message);
    }
} else {
    console.error('CRITICAL: Missing SUPABASE_URL or SUPABASE_KEY in environment variables.');
}

// Health Check (To test if the function is alive)
app.get('/api/health', (req, res) => {
    res.json({
        status: 'alive',
        time: new Date().toISOString(),
        env: process.env.NODE_ENV,
        hasSupabase: !!supabase
    });
});

// Fallback for root / to serve index.html if hit directly
app.get('/', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'index.html'));
});

// Global crash protection
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Ensure Supabase is ready before handling API requests
app.use('/api', (req, res, next) => {
    if (req.path === '/health') return next();
    if (!supabase) {
        return res.status(500).json({ error: 'Supabase client is not initialized. Please add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env' });
    }
    next();
});

// API endpoint to handle form submissions
app.post('/api/contact', async (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Please provide name, email, and message.' });
    }

    try {
        const { data, error } = await supabase
            .from('contacts')
            .insert([{ name, email, message }])
            .select();

        if (error) throw error;

        res.status(201).json({
            success: true,
            message: 'Message saved successfully',
            id: data && data.length > 0 ? data[0].id : null
        });
    } catch (err) {
        console.error('Error inserting data:', err.message);
        res.status(500).json({ error: 'Failed to save message due to a database error.' });
    }
});

// --- API ENDPOINTS FOR DYNAMIC CONTENT ---

// Middleware for simple admin authentication
const checkAuth = (req, res, next) => {
    const password = req.headers['x-admin-password'];
    if (password === process.env.ADMIN_PASSWORD) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

// Site Content
app.get('/api/content', async (req, res) => {
    try {
        const { data, error } = await supabase.from('site_content').select('*');
        if (error) throw error;

        const content = {};
        if (data) {
            data.forEach(row => {
                content[row.section_key] = row.content;
            });
        }
        res.json(content);
    } catch (err) {
        console.error('Error fetching content:', err);
        res.status(500).json({ error: 'Failed to fetch content' });
    }
});

app.put('/api/content', checkAuth, async (req, res) => {
    const updates = req.body; // Expects object: { hero_greeting: "Hello", ... }

    try {
        for (const [key, val] of Object.entries(updates)) {
            const { error } = await supabase
                .from('site_content')
                .upsert({ section_key: key, content: val }, { onConflict: 'section_key' });
            if (error) throw error;
        }

        res.json({ success: true });
    } catch (err) {
        console.error('Error updating content:', err);
        res.status(500).json({ error: 'Failed to update content' });
    }
});

// Skills
app.get('/api/skills', async (req, res) => {
    try {
        const { data, error } = await supabase.from('skills').select('*').order('id');
        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        console.error('Error fetching skills:', err);
        res.status(500).json({ error: 'Failed to fetch skills' });
    }
});

app.post('/api/skills', checkAuth, async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Skill name required' });

    try {
        const { data, error } = await supabase.from('skills').insert([{ name }]).select();
        if (error) throw error;
        res.status(201).json({ id: data[0].id, name });
    } catch (err) {
        console.error('Error adding skill:', err);
        res.status(500).json({ error: 'Failed to add skill' });
    }
});

app.delete('/api/skills/:id', checkAuth, async (req, res) => {
    try {
        const { error } = await supabase.from('skills').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting skill:', err);
        res.status(500).json({ error: 'Failed to delete skill' });
    }
});

// Projects
app.get('/api/projects', async (req, res) => {
    try {
        const { data, error } = await supabase.from('projects').select('*').order('id');
        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        console.error('Error fetching projects:', err);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

app.post('/api/projects', checkAuth, async (req, res) => {
    const { title, description, image_url, code_url, live_url } = req.body;

    try {
        const { data, error } = await supabase.from('projects').insert([{
            title, 
            description, 
            image_url: image_url || '', 
            code_url: code_url || '', 
            live_url: live_url || ''
        }]).select();

        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (err) {
        console.error('Error adding project:', err);
        res.status(500).json({ error: 'Failed to add project' });
    }
});

app.put('/api/projects/:id', checkAuth, async (req, res) => {
    const { title, description, image_url, code_url, live_url } = req.body;

    try {
        const { error } = await supabase.from('projects').update({
            title, description, image_url, code_url, live_url
        }).eq('id', req.params.id);

        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        console.error('Error updating project:', err);
        res.status(500).json({ error: 'Failed to update project' });
    }
});

app.delete('/api/projects/:id', checkAuth, async (req, res) => {
    try {
        const { error } = await supabase.from('projects').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting project:', err);
        res.status(500).json({ error: 'Failed to delete project' });
    }
});

// Messages (Admin only)
app.get('/api/messages', checkAuth, async (req, res) => {
    try {
        const { data, error } = await supabase.from('contacts').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        console.error('Error fetching messages:', err);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// Start the server except on Vercel serverless runtime
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

module.exports = app;
