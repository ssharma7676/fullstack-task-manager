import { fetchTasks, createTask, deleteTask as deleteTaskAPI, updateTask, deleteList, reorderTasks } from './api';
import { useEffect, useState } from 'react';

import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import './App.css'
import './Sidebar.css';
import './TodoList.css';

/**
 * TodoList component displays and manages tasks for a selected list.
 * Features: fetch, add, delete, complete, reorder (drag-and-drop), sort, and due dates.
 */
function TodoList({ selectedList, setLists, lists, setSelectedListId }) {
  // --- State ---
  const [draggedTaskId, setDraggedTaskId] = useState(null); // For drag-and-drop
  const [newTaskName, setNewTaskName] = useState(''); // New task input
  const [dueDateTime, setDueDateTime] = useState(null); // Due date/time for new task
  const [showDateTimeInput, setShowDateTimeInput] = useState(false); // Toggle date picker
  const [tasks, setTasks] = useState([]); // Tasks for the selected list
  const [loading, setLoading] = useState(false); // Loading state
  const [error, setError] = useState(''); // Error message

  // --- Fetch tasks when selectedList changes ---
  useEffect(() => {
    if (!selectedList) return;
    async function loadTasks() {
      setLoading(true);
      try {
        const backendTasks = await fetchTasks(selectedList._id);
        console.log('Fetched tasks order:', backendTasks.map(t => ({ id: t._id, order: t.order, name: t.name })));
        setTasks(backendTasks);
      } catch (err) {
        setError('Failed to load tasks from server');
      } finally {
        setLoading(false);
      }
    }
    loadTasks();
  }, [selectedList]);

  // --- Add a new task ---
  async function handleAddTask(e) {
    e.preventDefault();
    if (!newTaskName.trim()) return;
    const newTask = {
      name: newTaskName,
      completed: false,
      dueDateTimeISO: dueDateTime ? dueDateTime.toISOString() : null,
      list: selectedList._id,
      order: tasks.length,
    };
    try {
      const savedTask = await createTask(newTask);
      setTasks(prev => [...prev, savedTask]);
      setNewTaskName('');
      setDueDateTime(null);
      setShowDateTimeInput(false);
    } catch (err) {
      setError('Failed to add task');
    }
  }

  // --- Toggle task completion ---
  async function toggleTaskComplete(taskId) {
    const task = tasks.find(t => t._id === taskId);
    if (!task) return;
    const updatedCompleted = !task.completed;
    try {
      const savedTask = await updateTask(taskId, { completed: updatedCompleted });
      const updatedTasks = tasks.map(t =>
        t._id === taskId ? savedTask : t
      );
      setTasks(updatedTasks);
    } catch (err) {
      setError('Failed to update task');
    }
  }

  // --- Delete a task ---
  async function deleteTask(taskId) {
    try {
      await deleteTaskAPI(taskId);
      const updatedTasks = tasks.filter(task => task._id !== taskId);
      setTasks(updatedTasks);
    } catch (err) {
      setError('Failed to delete task');
    }
  }

  // --- Clear all completed tasks ---
  async function clearCompletedTasks() {
    try {
      // Get all completed tasks
      const completedTasks = tasks.filter(task => task.completed);
      // Delete each completed task from the backend
      for (const task of completedTasks) {
        await deleteTaskAPI(task._id);
      }
      // Update frontend state to remove completed tasks
      const updatedTasks = tasks.filter(task => !task.completed);
      setTasks(updatedTasks);
    } catch (err) {
      setError('Failed to clear completed tasks');
    }
  }

  // --- Delete the current list ---
  async function handleDeleteList() {
    if (!selectedList) return;
    setError('');
    setLoading(true);
    try {
      await deleteList(selectedList._id);
      // Remove the list from parent state
      setLists(prev => prev.filter(list => list._id !== selectedList._id));
      setSelectedListId(null);
    } catch (err) {
      setError('Failed to delete list');
    } finally {
      setLoading(false);
    }
  }

  // --- Sort tasks: incomplete first, then by due date/time, then completed ---
  async function handleSortTasks() {
    // Sort: incomplete first, then by due date/time, then completed
    const withDue = [];
    const withoutDue = [];
    const completed = [];
    tasks.forEach(task => {
      if (task.completed) {
        completed.push(task);
      } else if (task.dueDateTimeISO) {
        withDue.push(task);
      } else {
        withoutDue.push(task);
      }
    });
    withDue.sort((a, b) => new Date(a.dueDateTimeISO) - new Date(b.dueDateTimeISO));
    const sortedTasks = [...withDue, ...withoutDue, ...completed];
    setTasks(sortedTasks);
    // Persist new order to backend and refetch
    const orderedTaskIds = sortedTasks.map(task => task._id);
    await reorderTasks(selectedList._id, orderedTaskIds);
    const backendTasks = await fetchTasks(selectedList._id);
    setTasks(backendTasks);
  }

  // --- Progress calculation ---
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const progressPercent = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // --- Drag and drop handlers ---
  function handleDragStart(e, taskId) {
    setDraggedTaskId(taskId);
    e.currentTarget.classList.add('dragging');
    e.currentTarget.style.opacity = '0';
    // Create a ghost image for drag
    const ghost = e.currentTarget.cloneNode(true);
    const rect = e.currentTarget.getBoundingClientRect();
    ghost.style.position = 'absolute';
    ghost.style.top = '-9999px';
    ghost.style.left = '-9999px';
    ghost.style.width = `${rect.width}px`;
    ghost.style.height = `${rect.height}px`;
    ghost.style.opacity = '1';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    setTimeout(() => ghost.remove(), 0);
  }

  async function handleDragOver(e, targetTaskId) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedTaskId === targetTaskId) return;
    const updatedTasks = [...tasks];
    const fromIndex = updatedTasks.findIndex(task => task._id === draggedTaskId);
    const toIndex = updatedTasks.findIndex(task => task._id === targetTaskId);
    if (fromIndex < 0 || toIndex < 0) return;
    const [movedTask] = updatedTasks.splice(fromIndex, 1);
    updatedTasks.splice(toIndex, 0, movedTask);
    setTasks(updatedTasks);
    // Persist new order to backend and refetch
    const orderedTaskIds = updatedTasks.map(task => task._id);
    await reorderTasks(selectedList._id, orderedTaskIds);
    // Refetch tasks to ensure order is correct
    const backendTasks = await fetchTasks(selectedList._id);
    setTasks(backendTasks);
  }

  function handleDragEnd(e) {
    e.currentTarget.classList.remove('dragging');
    e.currentTarget.style.opacity = '1';
    setDraggedTaskId(null);
  }

  // --- Render ---
  return (
    <div className={`todo-wrapper${loading ? ' loading' : ''}`} style={{ position: 'relative' }}>
      <div className="todo-list">
        <div className="todo-header">
          <h2 className="list-title">{selectedList.name}</h2>
          <p className="task-count">{`${totalTasks - completedTasks} task${totalTasks - completedTasks === 1 ? '' : 's'} remaining`}</p>
        </div>

        <div className="todo-body">
          <div className="tasks">
            {tasks.map(task => {
              // --- Due date/time tag logic ---
              const dueDateTime = task.dueDateTimeISO ? new Date(task.dueDateTimeISO) : null;
              const now = new Date();
              let statusTag = null;
              if (dueDateTime) {
                const diff = dueDateTime - now;
                if (diff < 0) statusTag = <span className="time-tag overdue">Overdue</span>;
                else if (diff < 3600000) statusTag = (
                  <span className="time-tag soon">
                    Due soon: {dueDateTime.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true })}
                  </span>
                );
                else statusTag = (
                  <span className="time-tag later">
                    Due: {dueDateTime.toLocaleString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true, weekday: 'short', day: 'numeric', month: 'short' })}
                  </span>
                );
              }
              return (
                <div
                  key={task._id}
                  className={`task${task.completed ? ' completed' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task._id)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, task._id)}
                >                  
                  <input
                    type="checkbox"
                    id={task._id}
                    checked={task.completed}
                    onChange={() => toggleTaskComplete(task._id)}
                  />
                  <label htmlFor={task._id}>
                    <span className="custom-checkbox" aria-hidden="true"></span>
                    {task.name}
                  </label>
                  {statusTag}
                  <button className="delete-task-btn" onClick={() => deleteTask(task._id)} aria-label="Delete task" title="Delete task">x</button>
                </div>
              );
            })}
          </div>

          {/* New task form */}
          <div className="new-task-creator">
            <form onSubmit={handleAddTask} className="task-form">
              <div className="task-input-wrapper">
                <input
                  type="text"
                  value={newTaskName}
                  onChange={e => setNewTaskName(e.target.value)}
                  className="new task"
                  placeholder="new task name"
                  aria-label="new task name"
                />
                <div className="due-icons">
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => setShowDateTimeInput(!showDateTimeInput)}
                    title="Add due date/time"
                  >
                    <span className="material-icons">access_time</span>
                  </button>
                </div>
              </div>

              {showDateTimeInput && (
                <div className="date-time-picker-wrapper">
                  <DatePicker
                    selected={dueDateTime}
                    onChange={(date) => {
                      setDueDateTime(date);
                    }}
                    showTimeSelect
                    dateFormat="Pp"
                    placeholderText="Select due date/time"
                    className="datepicker-input"
                    disabled={loading}
                  />
                </div>
              )}

              <button className="btn create" title="Add new task" aria-label="create new task">
                +
              </button>
            </form>
          </div>

          {/* Progress Bar */}
          <div className="progress-wrapper">
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${progressPercent}%` }}></div>
            </div>
            <span className="progress-percent">{progressPercent}%</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="delete-stuff">
        <button className="btn delete" onClick={clearCompletedTasks} aria-label="Clear completed tasks">
          Clear completed tasks
        </button>
        <button className="btn delete" onClick={handleDeleteList} aria-label="Delete list">
          Delete list
        </button>
        <button className="btn delete" onClick={handleSortTasks} aria-label="Sort list">
          Sort list
        </button>
      </div>
      {error && <div className="error-message">{error}</div>}
    </div>
  );
}

export default TodoList;