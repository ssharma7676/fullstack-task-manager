// server/scripts/fixTaskOrder.js
const mongoose = require('mongoose');
const Task = require('../models/Task');
const List = require('../models/List');

require('dotenv').config();

async function fixOrder() {
  await mongoose.connect(process.env.MONGO_URI);

  const lists = await List.find();
  for (const list of lists) {
    const tasks = await Task.find({ list: list._id }).sort({ createdAt: 1 });
    for (let i = 0; i < tasks.length; i++) {
      tasks[i].order = i;
      await tasks[i].save();
    }
    console.log(`Fixed order for list: ${list.name}`);
  }

  await mongoose.disconnect();
  console.log('Done!');
}

fixOrder();