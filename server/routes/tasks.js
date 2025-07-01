const express = require('express');
const Task = require('../models/Task');
const List = require('../models/List');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get all tasks for the authenticated user and a specific list
// GET /api/tasks?list=<listId>
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { list } = req.query;
    if (!list) {
      return res.status(400).json({ error: 'List ID is required as a query parameter' });
    }
    // Ensure the list belongs to the user
    const foundList = await List.findOne({ _id: list, user: req.user.userId });
    if (!foundList) {
      return res.status(404).json({ error: 'List not found' });
    }
    const tasks = await Task.find({ user: req.user.userId, list }).sort({ order: 1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new task for the authenticated user and a specific list
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, completed, dueDateTimeISO, list } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Task name is required and must be a string' });
    }
    if (!list) {
      return res.status(400).json({ error: 'List ID is required' });
    }
    // Ensure the list belongs to the user
    const foundList = await List.findOne({ _id: list, user: req.user.userId });
    if (!foundList) {
      return res.status(404).json({ error: 'List not found' });
    }

    const taskCount = await Task.countDocuments({ list, user: req.user.userId });

    const newTask = new Task({
      name,
      completed: completed || false,
      dueDateTimeISO: dueDateTimeISO || null,
      user: req.user.userId,
      list,
      order: taskCount,
    });
    await newTask.save();
    res.status(201).json(newTask);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Reorder tasks in a list (first implementation)
// PUT /api/tasks/reorder
router.put('/reorder', authMiddleware, async (req, res) => {
  const { list, orderedTaskIds } = req.body;

  if (!list || !Array.isArray(orderedTaskIds)) {
    return res.status(400).json({ error: 'List ID and orderedTaskIds are required' });
  }

  try {
    // Verify the list belongs to the user
    const foundList = await List.findOne({ _id: list, user: req.user.userId });
    if (!foundList) {
      return res.status(404).json({ error: 'List not found' });
    }

    // Update the order for each task
    for (let i = 0; i < orderedTaskIds.length; i++) {
      const taskId = orderedTaskIds[i];
      await Task.findOneAndUpdate(
        { _id: taskId, user: req.user.userId, list },
        { order: i }
      );
    }

    res.status(200).json({ message: 'Task order updated successfully' });
  } catch (err) {
    console.error('Reorder error:', err);
    res.status(500).json({ error: 'Server error during reorder' });
  }
});

// Update a task by ID (only if it belongs to the user and list)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const updatedFields = req.body;
    // Optionally, ensure the list still belongs to the user if list is being changed
    const task = await Task.findOneAndUpdate(
      { _id: id, user: req.user.userId },
      updatedFields,
      { new: true }
    );
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a task (only if it belongs to the user and list)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findOneAndDelete({ _id: id, user: req.user.userId });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Reorder tasks in a list (second implementation)
router.put('/reorder', authMiddleware, async (req, res) => {
  console.log('Received reorder request:', req.body);
  try {
    const { list, orderedTaskIds } = req.body;
    if (!list || !Array.isArray(orderedTaskIds)) {
      return res.status(400).json({ error: 'List ID and orderedTaskIds array are required' });
    }
    // Ensure the list belongs to the user
    const foundList = await List.findOne({ _id: list, user: req.user.userId });
    if (!foundList) {
      return res.status(404).json({ error: 'List not found' });
    }
    // Update the order field for each task
    for (let i = 0; i < orderedTaskIds.length; i++) {
      await Task.updateOne(
        { _id: orderedTaskIds[i], list, user: req.user.userId },
        { $set: { order: i } }
      );
    }
    res.json({ message: 'Order updated' });
  } catch (err) {
    console.error('Error in /api/tasks/reorder:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 