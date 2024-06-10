import express from 'express';
import bodyParser from 'body-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from './db.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import cookieParser from 'cookie-parser';

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

const PORT = process.env.PORT || 3000;
const SECRET_KEY = 'your_secret_key';

// Get __dirname equivalent in ES6
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to verify token
const verifyToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(403).json({ error: 'No token provided' });
    }
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        req.userId = decoded.id;
        next();
    });
};

// Register user
app.post('/api/register', (req, res) => {
    const { hidden_email, hidden_username, hidden_password } = req.body;

    const hashedPassword = bcrypt.hashSync(hidden_password, 8);
    console.log('Hashed password:', hashedPassword);

    const sql = 'INSERT INTO users (email, username, password) VALUES (?, ?, ?)';
    const params = [hidden_email, hidden_username, hashedPassword];

    db.run(sql, params, function (err) {
        if (err) {
            console.error('Error during registration:', err.message);
            return res.status(400).json({ error: 'Registration failed', details: err.message });
        }
        console.log('User registered with ID:', this.lastID);
        const token = jwt.sign({ id: this.lastID }, SECRET_KEY, { expiresIn: 86400 }); // 24 hours
        res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'Strict' });
        res.status(201).json({ message: 'Registration successful', token });
    });
});

// Login user
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    const sql = 'SELECT * FROM users WHERE username = ?';
    const params = [username];

    db.get(sql, params, (err, user) => {
        if (err) {
            console.error('Error during login:', err.message);
            return res.status(400).json({ error: 'Login failed', details: err.message });
        }
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const passwordIsValid = bcrypt.compareSync(password, user.password);
        if (!passwordIsValid) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: 86400 }); // 24 hours
        res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'Strict' });
        res.status(200).json({ message: 'Login successful', token });
    });
});

// Fetch tasks for a user
app.get('/api/tasks', verifyToken, (req, res) => {
    const { category } = req.query;

    const sql = 'SELECT * FROM tasks WHERE user_id = ? AND category = ?';
    const params = [req.userId, category];

    console.log(`Fetching tasks for user_id: ${req.userId} and category: ${category}`); // Log the query parameters

    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error('Error loading tasks:', err.message);
            return res.status(400).json({ error: 'Failed to load tasks', details: err.message });
        }
        console.log('Tasks fetched:', rows); // Log the fetched tasks
        res.status(200).json({ tasks: rows });
    });
});

// Add a new task
app.post('/api/tasks', verifyToken, (req, res) => {
    const { category, content } = req.body;

    const sql = 'INSERT INTO tasks (user_id, category, content) VALUES (?, ?, ?)';
    const params = [req.userId, category, content];

    db.run(sql, params, function (err) {
        if (err) {
            console.error('Error adding task:', err.message);
            return res.status(400).json({ error: 'Failed to add task', details: err.message });
        }
        res.status(201).json({ message: 'Task added successfully', taskId: this.lastID });
    });
});

// Update an existing task
app.put('/api/tasks/:id', verifyToken, (req, res) => {
    const { id } = req.params;
    const { content } = req.body;

    const sql = 'UPDATE tasks SET content = ? WHERE id = ? AND user_id = ?';
    const params = [content, id, req.userId];

    db.run(sql, params, function (err) {
        if (err) {
            console.error('Error updating task:', err.message);
            return res.status(400).json({ error: 'Failed to update task', details: err.message });
        }
        res.status(200).json({ message: 'Task updated successfully' });
    });
});

// Delete an existing task
app.delete('/api/tasks/:id', verifyToken, (req, res) => {
    const { id } = req.params;

    const sql = 'DELETE FROM tasks WHERE id = ? AND user_id = ?';
    const params = [id, req.userId];

    db.run(sql, params, function (err) {
        if (err) {
            console.error('Error deleting task:', err.message);
            return res.status(400).json({ error: 'Failed to delete task', details: err.message });
        }
        res.status(200).json({ message: 'Task deleted successfully' });
    });
});

// Serve HTML files
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.get('/home', verifyToken, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'home.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
