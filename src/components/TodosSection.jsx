import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import CardHeader from './TodosCardHeader';
import StatusMsg from './StatusMsg';
import TodoForm from './TodosForm';
import TodosListHeader from './TodosListHeader';
import TodosList from './TodosList';
import TodosConfetti from './TodosConfetti';
import '../css/Todos.css';

const STORAGE_KEY = 'todoAppState';

const loadStateFromStorage = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return { todos: [], filter: 'all', sort: 'created' };
  try {
    const parsed = JSON.parse(saved);
    return {
      todos: Array.isArray(parsed.todos) ? parsed.todos : [],
      filter: parsed.filter || 'all',
      sort: parsed.sort || 'created'
    };
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return { todos: [], filter: 'all', sort: 'created' };
  }
};

function TodosSection() {
  const { authToken, forceLogout } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const initialState = loadStateFromStorage();

  const [todos, setTodos] = useState(initialState.todos);
  const [filter, setFilter] = useState(initialState.filter);
  const [sort, setSort] = useState(initialState.sort);
  const [editingId, setEditingId] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [statusType, setStatusType] = useState('default');
  
  // Celebration state
  const [showCelebration, setShowCelebration] = useState(false);
  const lastActiveCountRef = useRef(initialState.todos.filter(t => !t.completed).length);

  const showStatus = useCallback((message, type = 'default') => {
    setStatusMsg(message);
    setStatusType(type);
  }, [setStatusMsg, setStatusType]);

  const getAuthToken = useCallback(() => {
    const stored = localStorage.getItem('todoAppAuth');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed.authToken;
      } catch (e) {
        console.error('Failed to parse auth token:', e);
        return null;
      }
    }
    return null;
  }, []);

  const apiFetch = useCallback(async (path, options = {}) => {
    const token = getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    } else {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      // Handle 401 Unauthorized - token expired or invalid
      if (response.status === 401) {
        forceLogout();
        throw new Error('Session expired. Please log in again.');
      }
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  }, [getAuthToken, API_URL, forceLogout]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      todos,
      filter,
      sort
    }));
  }, [todos, filter, sort]);

  // Trigger celebration when all todos are completed
  useEffect(() => {
    const activeCount = todos.filter(t => !t.completed).length;
    const allCompleted = activeCount === 0 && todos.length > 0;

    // Check if we just completed the last active todo
    if (allCompleted && lastActiveCountRef.current > 0) {
      // Use setTimeout with 0 to defer setState and avoid the warning
      const celebrationTimer = setTimeout(() => {
        setShowCelebration(true);
        const hideTimer = setTimeout(() => {
          setShowCelebration(false);
        }, 5000); // Auto-hide after 5 seconds
        return () => clearTimeout(hideTimer);
      }, 0);
      
      return () => clearTimeout(celebrationTimer);
    }

    // Update refs after checking conditions
    lastActiveCountRef.current = activeCount;
  }, [todos]);

  const fetchTodos = useCallback(async () => {
    try {
      console.log('Fetching todos...');
      const data = await apiFetch('/todos', { method: 'GET' });
      setTodos(data);
      showStatus('Todos refreshed!', 'success');
    } catch (error) {
      console.error('Fetch error:', error);
      showStatus('Error fetching todos: ' + error.message, 'error');
    }
  }, [apiFetch, setTodos, showStatus]);

  // Fetch todos when authenticated
  useEffect(() => {
    if (authToken) {
      // eslint-disable-next-line
      fetchTodos();
    }
  }, [authToken, fetchTodos]);

  const handleCreateTodo = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = {
      title: formData.get('title').trim(),
      description: formData.get('description').trim(),
      completed: e.target.completed.checked
    };

    if (!payload.title || !payload.description) {
      showStatus('Title and description are required.', 'error');
      return;
    }

    try {
      const created = await apiFetch('/todos', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setTodos([created, ...todos]);
      e.target.reset();
      showStatus('Todo saved successfully!', 'success');
    } catch (error) {
      showStatus('Error saving todo: ' + error.message, 'error');
    }
  };

  const handleSaveEdit = async (todoId, title, description, completed) => {
    if (!title.trim() || !description.trim()) {
      showStatus('Title and description are required.', 'error');
      return;
    }

    try {
      const updated = await apiFetch(`/todos/${todoId}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          completed
        })
      });
      setTodos(todos.map((item) => (item.id === updated.id ? updated : item)));
      setEditingId(null);
      showStatus('Todo updated successfully!', 'success');
    } catch (error) {
      showStatus(error.message, 'error');
    }
  };

  const handleToggleComplete = async (todo) => {
    try {
      const updated = await apiFetch(`/todos/${todo.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: todo.title,
          description: todo.description,
          completed: !todo.completed
        })
      });
      if (!todo.completed && updated.completed) {
        updated.completedAt = updated.completedAt || new Date().toISOString();
      }
      if (todo.completed && !updated.completed) {
        updated.completedAt = null;
      }
      setTodos(todos.map((item) => (item.id === updated.id ? updated : item)));
      showStatus(
        updated.completed ? 'Todo marked as completed!' : 'Todo marked as active!',
        'success'
      );
    } catch (error) {
      showStatus(error.message, 'error');
    }
  };

  const handleDeleteTodo = async (todoId) => {
    try {
      await apiFetch(`/todos/${todoId}`, { method: 'DELETE' });
      setTodos(todos.filter((item) => item.id !== todoId));
      showStatus('Todo deleted successfully!', 'success');
    } catch (error) {
      showStatus(error.message, 'error');
    }
  };

  const filteredAndSorted = todos
    .slice()
    .sort((a, b) => {
      if (sort === 'created') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (sort === 'edited') {
        const aEdited = a.editedAt ? new Date(a.editedAt) : new Date(0);
        const bEdited = b.editedAt ? new Date(b.editedAt) : new Date(0);
        return bEdited - aEdited;
      }
      if (sort === 'title') {
        return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
      }
      if (sort === 'status') {
        return Number(a.completed) - Number(b.completed);
      }
      return 0;
    })
    .filter((todo) => {
      if (filter === 'completed') return todo.completed;
      if (filter === 'active') return !todo.completed;
      return true;
    });

  return (
    <section id="todos-section" className="card" aria-labelledby="todos-title">
      <CardHeader onRefresh={fetchTodos} isDisabled={filteredAndSorted.length === 0} />

      <StatusMsg message={statusMsg} type={statusType} />

      <TodoForm onSubmit={handleCreateTodo} onCancel={() => {}} />

      <TodosListHeader 
        filter={filter} 
        sort={sort} 
        onFilterChange={setFilter}
        onSortChange={setSort}
        isSortDisabled={filteredAndSorted.length <= 1}
      />

      <TodosList
        todos={filteredAndSorted}
        editingId={editingId}
        onEdit={setEditingId}
        onToggleComplete={handleToggleComplete}
        onDelete={handleDeleteTodo}
        onSaveEdit={handleSaveEdit}
        onCancelEdit={() => setEditingId(null)}
      />

      <TodosConfetti isActive={showCelebration} onAnimationEnd={() => setShowCelebration(false)} />
    </section>
  );
}

export default TodosSection;
