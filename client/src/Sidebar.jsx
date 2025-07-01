import { useState, useEffect } from 'react';
import { fetchLists, createList, deleteList } from './api';

/**
 * Sidebar component that displays and manages user's todo lists
 * Allows creating new lists and selecting which list to view
 */
function Sidebar({ lists, selectedListId, setSelectedListId, setLists }) {
  const [newListName, setNewListName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch lists from backend on component mount
  useEffect(() => {
    async function loadLists() {
      setLoading(true);
      setError('');
      try {
        const backendLists = await fetchLists();
        setLists(backendLists);
        // Select the first list if none is currently selected
        if (backendLists.length && !selectedListId) {
          setSelectedListId(backendLists[0]._id);
        }
      } catch (err) {
        setError('Failed to load lists');
      } finally {
        setLoading(false);
      }
    }
    loadLists();
    // eslint-disable-next-line
  }, []);

  // Create a new list
  async function handleAddList(e) {
    e.preventDefault();
    if (!newListName.trim()) return;
    
    setLoading(true);
    setError('');
    try {
      const newList = await createList(newListName.trim());
      const backendLists = await fetchLists();
      setLists(backendLists);
      setSelectedListId(newList._id);
      setNewListName('');
    } catch (err) {
      setError('Failed to create list');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="all-tasks">
      <h2 className="task-list-title">My lists</h2>
      {error && <div className="error-message">{error}</div>}
      
      {/* List of existing lists */}
      <ul className="task-list">
        {lists.map(list => (
          <li
            key={list._id}
            className={`list-name ${list._id === selectedListId ? 'active-list' : ''}`}
            onClick={() => setSelectedListId(list._id)}
          >
            {list.name}
          </li>
        ))}
      </ul>

      {/* Form to create new list */}
      <form onSubmit={handleAddList} style={{ marginTop: 16 }}>
        <input
          type="text"
          className="new list"
          placeholder="new list name"
          value={newListName}
          onChange={e => setNewListName(e.target.value)}
          aria-label="new list name"
          disabled={loading}
        />
        <button 
          className="btn create" 
          title="Add new list" 
          aria-label="create new list" 
          disabled={loading}
        >
          +
        </button>
      </form>
    </div>
  );
}

export default Sidebar;