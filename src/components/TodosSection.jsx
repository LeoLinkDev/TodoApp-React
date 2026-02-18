import { useState, useEffect, useCallback } from 'react';
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
  const { authToken } = useAuth();
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
  const [lastActiveCount, setLastActiveCount] = useState(initialState.todos.filter(t => !t.completed).length);
  const [lastCompletedCount, setLastCompletedCount] = useState(initialState.todos.filter(t => t.completed).length);

  const showStatus = (message, type = 'default') => {
    setStatusMsg(message);
    setStatusType(type);
  };

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
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  }, [getAuthToken, API_URL]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      todos,
      filter,
      sort
    }));
  }, [todos, filter, sort]);

  // Check for all-completed celebration
  useEffect(() => {
    const activeCount = todos.filter(t => !t.completed).length;
    const completedCount = todos.filter(t => t.completed).length;
    const allCompleted = activeCount === 0 && todos.length > 0;

    // Trigger celebration if:
    // 1. All todos are completed
    // 2. We just completed something (activeCount decreased)
    // 3. We haven't shown celebration yet
    const justCompletedAll = 
      allCompleted && 
      lastActiveCount > 0 && 
      completedCount > lastCompletedCount;

    if (justCompletedAll && !showCelebration) {
      setShowCelebration(true);
    }

    setLastActiveCount(activeCount);
    setLastCompletedCount(completedCount);
  }, [todos, lastActiveCount, lastCompletedCount, showCelebration]);

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
  }, [apiFetch]);

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
