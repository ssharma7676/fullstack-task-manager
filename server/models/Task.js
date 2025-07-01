const mongoose = require('mongoose');

// Task model schema for individual todo items
const TaskSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  dueDateTimeISO: {
    type: String,
    default: null,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  list: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'List',
    required: true,
  },
  order: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema); 