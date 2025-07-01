const express = require('express');
const List = require('../models/List');
const Task = require('../models/Task');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get all lists for the authenticated user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const lists = await List.find({ user: req.user.userId });
    res.json(lists);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new list for the authenticated user
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'List name is required and must be a string' });
    }
    const newList = new List({ name, user: req.user.userId });
    await newList.save();
    res.status(201).json(newList);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a list by ID (only if it belongs to the user)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const updatedFields = req.body;
    const list = await List.findOneAndUpdate(
      { _id: id, user: req.user.userId },
      updatedFields,
      { new: true }
    );
    if (!list) {
      return res.status(404).json({ error: 'List not found' });
    }
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a list and all its tasks (only if it belongs to the user)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const list = await List.findOneAndDelete({ _id: id, user: req.user.userId });
    if (!list) {
      return res.status(404).json({ error: 'List not found' });
    }
    // Delete all tasks in this list
    await Task.deleteMany({ list: id, user: req.user.userId });
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 