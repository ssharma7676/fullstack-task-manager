import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import Sidebar from './Sidebar';
import TodoList from './TodoList';
import Login from './Login';
import Register from './Register';

import './App.css';
import './Sidebar.css';
import './TodoList.css';

function App() {
  const { isAuthenticated, logout, isLoading } = useAuth();
  const [showLogin, setShowLogin] = useState(true);
  const [lists, setLists] = useState([]);

  // Initialize selectedListId from localStorage
  const [selectedListId, setSelectedListId] = useState(() => {
    return localStorage.getItem('selectedListId') || null;
  });

  // Save selectedListId to localStorage whenever it changes
  useEffect(() => {
    if (selectedListId) {
      localStorage.setItem('selectedListId', selectedListId);
    } else {
      localStorage.removeItem('selectedListId');
    }
  }, [selectedListId]);

  // Ensure selectedListId is valid whenever lists are updated
  useEffect(() => {
    if (!lists.length) {
      setSelectedListId(null);
      return;
    }

    const savedListId = localStorage.getItem('selectedListId');
    const savedIsValid = savedListId && lists.some(l => l._id === savedListId);

    if (savedIsValid) {
      setSelectedListId(savedListId);
    } else {
      setSelectedListId(lists[0]._id);
    }
  }, [lists]);

  // Test backend connection when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetch("http://localhost:5000/api/test")
        .then(res => res.json())
        .then(data => {
          console.log(data.message);
        })
        .catch(err => {
          console.error("Error connecting to backend:", err);
        });
    }
  }, [isAuthenticated]);

  const selectedList = lists.find(list => list._id === selectedListId);

  if (isLoading) {
    return (
      <div className="app-grid">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          fontSize: '18px',
          color: '#666'
        }}>
          Loading...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return showLogin ? (
      <Login onSwitchToRegister={() => setShowLogin(false)} />
    ) : (
      <Register onSwitchToLogin={() => setShowLogin(true)} />
    );
  }

  return (
    <>
      <div className="app-grid">
        <div className="logout-wrapper">
          <button onClick={logout} className="logout-button">
            Logout
          </button>
        </div>

        <h1 className="title">One task at a time...</h1>

        <Sidebar
          lists={lists}
          selectedListId={selectedListId}
          setSelectedListId={setSelectedListId}
          setLists={setLists}
        />

        {selectedList && (
          <TodoList 
            selectedList={selectedList}
            setLists={setLists}
            lists={lists}
            setSelectedListId={setSelectedListId}
          />
        )}
      </div>
    </>
  );
}

export default App;