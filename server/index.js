// Load environment variables
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// Middleware setup
app.use(cors());
app.use(express.json());

// Import middleware and models
const authMiddleware = require('./middleware/auth');
const Task = require('./models/Task');

// Connect to MongoDB database
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });

// API Routes
const tasksRouter = require('./routes/tasks');
app.use('/api/tasks', tasksRouter);

const authRouter = require('./routes/auth');
app.use('/api/auth', authRouter);

const listsRouter = require('./routes/lists');
app.use('/api/lists', listsRouter);

// Start server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// Test endpoint for debugging
app.get('/api/logtest', (req, res) => {
  console.log('Logtest endpoint hit!');
  res.json({ ok: true });
});