import express from 'express';
import crypto from 'crypto';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Enable CORS for all routes
app.use(cors({
  // Allow all origins
  origin: '*',
  // Allow following methods
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  // Allow following headers
  allowedHeaders: ['Content-Type', 'Authorization'],
  // Enable credentials
  credentials: true,
  // How long the results of a preflight request can be cached
  maxAge: 86400 // 24 hours
}));

app.use(express.json());

const DATA_FILE = path.join(__dirname, 'data.json');

// Storage (persisted to disk)
let users = {};
let todos = {};

const normalizeUsername = (username) => (username || '').trim().toLowerCase();

const getUserKey = (username) => {
  const normalized = normalizeUsername(username);
  if (!normalized) return '';
  if (users[normalized]) return normalized;
  return Object.keys(users).find(key => key.toLowerCase() === normalized) || '';
};

const loadData = () => {
  try {
    if (!fs.existsSync(DATA_FILE)) return;
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    if (!raw) return;
    const parsed = JSON.parse(raw);
    users = parsed.users || {};
    todos = parsed.todos || {};
    const migratedUsers = {};
    const migratedTodos = {};
    Object.entries(users).forEach(([key, user]) => {
      const usernameKey = normalizeUsername(user?.username || key);
      if (!usernameKey) return;
      if (!migratedUsers[usernameKey]) {
        migratedUsers[usernameKey] = {
          ...user,
          usernameKey
        };
      }
      const primaryTodos = Array.isArray(migratedTodos[usernameKey])
        ? migratedTodos[usernameKey]
        : [];
      const incomingTodos = Array.isArray(todos[key])
        ? todos[key]
        : (Array.isArray(todos[usernameKey]) ? todos[usernameKey] : []);
      const merged = [...primaryTodos];
      incomingTodos.forEach(item => {
        if (!merged.find(existing => existing.id === item.id)) {
          merged.push(item);
        }
      });
      migratedTodos[usernameKey] = merged;
    });
    users = migratedUsers;
    todos = migratedTodos;
  } catch (error) {
    console.error('Failed to load data store:', error);
  }
};

const saveData = () => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ users, todos }, null, 2));
  } catch (error) {
    console.error('Failed to save data store:', error);
  }
};

loadData();

// Extract token from Authorization header
const extractToken = (authHeader) => {
  if (!authHeader) return null;
  return authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : authHeader;
};

// Find user by token
const findUserByToken = (token) => 
  Object.values(users).find(u => u.token === token);

// Middleware for authentication
const authenticateUser = (req, res, next) => {
  const token = extractToken(req.headers.authorization);
  
  if (!token || !findUserByToken(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
};

// Get current user
app.get('/me', authenticateUser, (req, res) => {
  const token = extractToken(req.headers.authorization);
  const user = findUserByToken(token);

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  res.json({ id: user.id, username: user.username });
});

// Register user
app.post('/register', (req, res) => {
  const { username, password } = req.body;
  const displayUsername = String(username || '').trim();
  const usernameKey = getUserKey(displayUsername) || normalizeUsername(displayUsername);
  
  /* For security reasons, change so that app doesn't "verify" that a username exists
   but just returns a generic error message like: username/password are incorrect. */
  if (!usernameKey) {
    return res.status(400).json({ error: 'Username is required' });
  }
  if (users[usernameKey]) {
    return res.status(400).json({ error: 'Username already exists' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  users[usernameKey] = {
    username: displayUsername,
    usernameKey,
    password,
    token,
    id: Object.keys(users).length + 1
  };

  todos[usernameKey] = [];
  saveData();

  res.status(201).json({ 
    id: users[usernameKey].id,
    username: displayUsername,
    token
  });
});

// Login user
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const displayUsername = String(username || '').trim();
  const userKey = getUserKey(displayUsername) || normalizeUsername(displayUsername);
  const user = userKey ? users[userKey] : null;

  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  res.json({ 
    id: user.id, 
    username, 
    token: user.token 
  });
});

// Logout user (clear token)
app.post('/logout', authenticateUser, (req, res) => {
  const token = extractToken(req.headers.authorization);
  const user = findUserByToken(token);

  if (user) {
    // Generate a new token to invalidate the old one
    user.token = crypto.randomBytes(32).toString('hex');
    saveData();
    res.json({ message: 'Logged out successfully' });
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// Create todo
app.post('/todos', authenticateUser, (req, res) => {
  const token = extractToken(req.headers.authorization);
  const user = findUserByToken(token);
  const { title, description, completed } = req.body;
  if (!todos[user.usernameKey]) {
    todos[user.usernameKey] = [];
  }

  const newTodo = {
    id: crypto.randomBytes(16).toString('hex'),
    title,
    description,
    completed: Boolean(completed),
    createdAt: new Date().toISOString(),
    editedAt: null,
    completedAt: completed ? new Date().toISOString() : null
  };

  todos[user.usernameKey].push(newTodo);
  saveData();
  res.status(201).json(newTodo);
});

// Get all todos
app.get('/todos', authenticateUser, (req, res) => {
  const token = extractToken(req.headers.authorization);
  const user = findUserByToken(token);
  if (!todos[user.usernameKey]) {
    todos[user.usernameKey] = [];
  }
  res.json(todos[user.usernameKey]);
});

// Update todo
app.put('/todos/:id', authenticateUser, (req, res) => {
  const token = extractToken(req.headers.authorization);
  const user = findUserByToken(token);
  const todoId = req.params.id;
  const { title, description, completed } = req.body;
  if (!todos[user.usernameKey]) {
    todos[user.usernameKey] = [];
  }

  const todoToUpdate = todos[user.usernameKey].find(todo => todo.id === todoId);
  
  if (!todoToUpdate) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  const wasCompleted = todoToUpdate.completed;
  todoToUpdate.title = title || todoToUpdate.title;
  todoToUpdate.description = description || todoToUpdate.description;
  if (completed !== undefined) {
    todoToUpdate.completed = completed;
    if (!wasCompleted && completed) {
      todoToUpdate.completedAt = new Date().toISOString();
    }
    if (wasCompleted && !completed) {
      todoToUpdate.completedAt = null;
    }
  }
  todoToUpdate.editedAt = new Date().toISOString();

  saveData();
  res.json(todoToUpdate);
});

// Delete todo
app.delete('/todos/:id', authenticateUser, (req, res) => {
  const token = extractToken(req.headers.authorization);
  const user = findUserByToken(token);
  const todoId = req.params.id;
  if (!todos[user.usernameKey]) {
    todos[user.usernameKey] = [];
  }

  const todoIndex = todos[user.usernameKey].findIndex(todo => todo.id === todoId);
  
  if (todoIndex === -1) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  todos[user.usernameKey].splice(todoIndex, 1);
  saveData();
  res.status(204).send();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Module export for testing
export default app;
