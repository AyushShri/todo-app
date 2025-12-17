const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// In-memory store for todos
// A todo: { id, title, description, dueAt, done, createdAt, updatedAt }
let todos = [];
let nextId = 1;

// Helper to parse and validate date-time
function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

// Create a todo
app.post('/todos', (req, res) => {
  const { title, description, dueAt } = req.body;

  if (!title || typeof title !== 'string') {
    return res.status(400).json({ error: 'Title is required and must be a string.' });
  }

  const parsedDueAt = parseDate(dueAt);
  if (dueAt && !parsedDueAt) {
    return res.status(400).json({ error: 'Invalid dueAt date-time format.' });
  }

  const now = new Date();
  const todo = {
    id: nextId++,
    title,
    description: description || '',
    dueAt: parsedDueAt,
    done: false,
    createdAt: now,
    updatedAt: now,
  };

  todos.push(todo);
  return res.status(201).json(todo);
});

// Get all todos
app.get('/todos', (req, res) => {
  return res.json(todos);
});

// Get a single todo by id
app.get('/todos/:id', (req, res) => {
  const id = Number(req.params.id);
  const todo = todos.find(t => t.id === id);
  if (!todo) {
    return res.status(404).json({ error: 'Todo not found.' });
  }
  return res.json(todo);
});

// Update a todo (partial update)
app.put('/todos/:id', (req, res) => {
  const id = Number(req.params.id);
  const todo = todos.find(t => t.id === id);

  if (!todo) {
    return res.status(404).json({ error: 'Todo not found.' });
  }

  const { title, description, dueAt, done } = req.body;

  if (title !== undefined) {
    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: 'Title must be a non-empty string when provided.' });
    }
    todo.title = title;
  }

  if (description !== undefined) {
    todo.description = description;
  }

  if (dueAt !== undefined) {
    const parsedDueAt = parseDate(dueAt);
    if (dueAt && !parsedDueAt) {
      return res.status(400).json({ error: 'Invalid dueAt date-time format.' });
    }
    todo.dueAt = parsedDueAt;
  }

  if (done !== undefined) {
    todo.done = Boolean(done);
  }

  todo.updatedAt = new Date();
  return res.json(todo);
});

// Delete a todo
app.delete('/todos/:id', (req, res) => {
  const id = Number(req.params.id);
  const index = todos.findIndex(t => t.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Todo not found.' });
  }
  const deleted = todos.splice(index, 1)[0];
  return res.json(deleted);
});

// Mark a todo as done
app.post('/todos/:id/done', (req, res) => {
  const id = Number(req.params.id);
  const todo = todos.find(t => t.id === id);

  if (!todo) {
    return res.status(404).json({ error: 'Todo not found.' });
  }

  todo.done = true;
  todo.updatedAt = new Date();
  return res.json(todo);
});

// List remaining todos based on current time
// "Remaining" = not done AND (no dueAt OR dueAt >= now)
app.get('/todos-remaining', (req, res) => {
  const now = new Date();
  const remaining = todos.filter(t => !t.done && (!t.dueAt || t.dueAt >= now));
  return res.json(remaining);
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Todo backend server running on http://localhost:${PORT}`);
});


