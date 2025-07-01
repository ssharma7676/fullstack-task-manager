const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Helper function to get authentication token from localStorage
 */
function getAuthToken() {
  return localStorage.getItem('authToken');
}

/**
 * Helper function to make authenticated HTTP requests
 * Automatically includes auth token and handles common error responses
 */
async function authenticatedFetch(url, options = {}) {
  const token = getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || 'Request failed');
  }

  return response;
}

// --- Authentication API ---
export async function loginUser(credentials) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Login failed');
  }
  
  return response.json();
}

export async function registerUser(userData) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Registration failed');
  }
  
  return response.json();
}

// --- Lists API ---
export async function fetchLists() {
  const response = await authenticatedFetch(`${API_BASE_URL}/lists`);
  return response.json();
}

export async function createList(name) {
  const response = await authenticatedFetch(`${API_BASE_URL}/lists`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
  return response.json();
}

export async function updateList(listId, updatedFields) {
  const response = await authenticatedFetch(`${API_BASE_URL}/lists/${listId}`, {
    method: 'PUT',
    body: JSON.stringify(updatedFields),
  });
  return response.json();
}

export async function deleteList(listId) {
  await authenticatedFetch(`${API_BASE_URL}/lists/${listId}`, {
    method: 'DELETE',
  });
}

// --- Tasks API ---
export async function fetchTasks(listId) {
  if (!listId) throw new Error('List ID is required to fetch tasks');
  const response = await authenticatedFetch(`${API_BASE_URL}/tasks?list=${listId}`);
  return response.json();
}

export async function createTask(task) {
  if (!task.list) throw new Error('List ID is required to create a task');
  const response = await authenticatedFetch(`${API_BASE_URL}/tasks`, {
    method: 'POST',
    body: JSON.stringify(task),
  });
  return response.json();
}

export async function deleteTask(id) {
  await authenticatedFetch(`${API_BASE_URL}/tasks/${id}`, {
    method: 'DELETE',
  });
}

export async function updateTask(taskId, updatedFields) {
  const response = await authenticatedFetch(`${API_BASE_URL}/tasks/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify(updatedFields),
  });
  return response.json();
}

export async function reorderTasks(listId, orderedTaskIds) {
  const response = await authenticatedFetch(`${API_BASE_URL}/tasks/reorder`, {
    method: 'PUT',
    body: JSON.stringify({ list: listId, orderedTaskIds }),
  });
  return response.json();
}