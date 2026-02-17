import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import CardHeader from './TodosCardHeader';
import StatusMsg from './StatusMsg';
import TodoForm from './TodosForm';
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

      <div className="list-header">
        <span>Items</span>
        <div className="filters" role="group" aria-label="Filter todos">
          <button
            className={`chip${filter === 'all' ? ' active' : ''}`}
            type="button"
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`chip${filter === 'active' ? ' active' : ''}`}
            type="button"
            onClick={() => setFilter('active')}
          >
            Active
          </button>
          <button
            className={`chip${filter === 'completed' ? ' active' : ''}`}
            type="button"
            onClick={() => setFilter('completed')}
          >
            Completed
          </button>
          <label className="sort-select">
            <span className="visually-hidden">Sort todos</span>
            <span className="sort-prefix" aria-hidden="true">
              Sort:
            </span>
            <select
              id="sort-select"
              aria-label="Sort todos"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              disabled={filteredAndSorted.length <= 1}
            >
              <option value="created">Created</option>
              <option value="edited">Edited</option>
              <option value="title">Title</option>
              <option value="status">Status</option>
            </select>
          </label>
        </div>
      </div>

      <ul id="todo-list" className="todo-list" aria-live="polite">
        {filteredAndSorted.length === 0 ? (
          <li className="todo-item">No todos yet. Add one above!</li>
        ) : (
          filteredAndSorted.map((todo) => {
            if (todo.id === editingId) {
              return (
                <TodoItemEdit
                  key={todo.id}
                  todo={todo}
                  onSave={handleSaveEdit}
                  onCancel={() => setEditingId(null)}
                />
              );
            }
            return (
              <TodoItem
                key={todo.id}
                todo={todo}
                onEdit={() => setEditingId(todo.id)}
                onToggleComplete={() => handleToggleComplete(todo)}
                onDelete={() => handleDeleteTodo(todo.id)}
              />
            );
          })
        )}
      </ul>

      <div id="confetti-overlay" className="confetti-overlay" aria-hidden="true">
        <div className="confetti-message" role="status" aria-live="polite">
          Congratulations!
        </div>
        <div id="confetti-container" className="confetti-container"></div>
      </div>
    </section>
  );
}

function TodoItem({ todo, onEdit, onToggleComplete, onDelete }) {
  return (
    <li className={`todo-item${todo.completed ? ' completed' : ''}`}>
      <div className="todo-title">
        <div className="todo-title-main">
          <h3>{todo.title}</h3>
        </div>
        <span className="todo-meta todo-title-status">
          {todo.completed ? 'Completed' : 'Active'}
        </span>
      </div>
      <p>{todo.description}</p>
      <p className="todo-meta">Created {new Date(todo.createdAt).toLocaleString()}</p>
      <p className="todo-meta todo-meta-edited">
        {todo.editedAt
          ? `Edited ${new Date(todo.editedAt).toLocaleString()}`
          : 'Edited —'}
      </p>
      <p className="todo-meta todo-meta-edited">
        {todo.completedAt
          ? `Completed ${new Date(todo.completedAt).toLocaleString()}`
          : 'Completed —'}
      </p>
      <div className="todo-actions">
        <button type="button" onClick={onEdit}>
          Edit
        </button>
        <button type="button" onClick={onToggleComplete}>
          {todo.completed ? 'Mark active' : 'Mark complete'}
        </button>
        <button type="button" className="danger" onClick={onDelete}>
          Delete
        </button>
      </div>
    </li>
  );
}

function TodoItemEdit({ todo, onSave, onCancel }) {
  const [title, setTitle] = useState(todo.title);
  const [description, setDescription] = useState(todo.description);
  const [completed, setCompleted] = useState(todo.completed);

  return (
    <li className="todo-item editing">
      <label className="todo-edit-label">
        Title
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </label>
      <label className="todo-edit-label">
        Description
        <textarea
          rows="3"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        ></textarea>
      </label>
      <label className="checkbox">
        <input
          type="checkbox"
          checked={completed}
          onChange={(e) => setCompleted(e.target.checked)}
        />
        Mark as complete
      </label>
      <p className="todo-meta">Created {new Date(todo.createdAt).toLocaleString()}</p>
      <div className="todo-actions">
        <button type="button" onClick={() => onSave(todo.id, title, description, completed)}>
          Save
        </button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </li>
  );
}

export default TodosSection;
