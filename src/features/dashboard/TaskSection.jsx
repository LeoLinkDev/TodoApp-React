// handles the main tasks section; form, list, and status messages.
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import CardHeader from './TaskCardHeader';
import StatusMsg from '../../components/common/StatusMsg';
import TaskForm from './TaskForm';
import TaskListHeader from './TaskListHeader';
import TaskList from './TaskList';
import TaskConfetti from './TaskConfetti';
import '../../styles/Tasks.css';

const OLD_STORAGE_KEY = 'todoAppState';
const STORAGE_KEY = 'tasksAppState';

const loadStateFromStorage = () => {
  // migrate old key if present
  try {
    const old = localStorage.getItem(OLD_STORAGE_KEY);
    if (old) {
      const parsedOld = JSON.parse(old);
      const migrated = {
        tasks: Array.isArray(parsedOld.todos) ? parsedOld.todos : [],
        filter: parsedOld.filter || 'all',
        sort: parsedOld.sort || 'created'
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      localStorage.removeItem(OLD_STORAGE_KEY);
      return migrated;
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return { tasks: [], filter: 'all', sort: 'created' };
    const parsed = JSON.parse(saved);
    return {
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      filter: parsed.filter || 'all',
      sort: parsed.sort || 'created'
    };
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(OLD_STORAGE_KEY);
    return { tasks: [], filter: 'all', sort: 'created' };
  }
};

function TasksSection() {
  const { authToken, forceLogout } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const initialState = loadStateFromStorage();

  const [tasks, setTasks] = useState(initialState.tasks);
  const [filter, setFilter] = useState(initialState.filter);
  const [sort, setSort] = useState(initialState.sort);
  const [editingId, setEditingId] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [statusType, setStatusType] = useState('default');
  const [showNewForm, setShowNewForm] = useState(false);

  // Celebration state
  const [showCelebration, setShowCelebration] = useState(false);
  const lastActiveCountRef = useRef(initialState.tasks.filter(t => !t.completed).length);

  const showStatus = useCallback((message, type = 'default') => {
    setStatusMsg(message);
    setStatusType(type);
  }, [setStatusMsg, setStatusType]);

  const apiFetch = useCallback(async (path, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    } else {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers
    });

    if (!response.ok) {
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
  }, [authToken, API_URL, forceLogout]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      tasks,
      filter,
      sort
    }));
  }, [tasks, filter, sort]);

  // Trigger celebration when all todos are completed
  useEffect(() => {
    const activeCount = tasks.filter(t => !t.completed).length;
    const allCompleted = activeCount === 0 && tasks.length > 0;

    if (allCompleted && lastActiveCountRef.current > 0) {
      const celebrationTimer = setTimeout(() => {
        setShowCelebration(true);
        const hideTimer = setTimeout(() => {
          setShowCelebration(false);
        }, 5000);
        return () => clearTimeout(hideTimer);
      }, 0);
      return () => clearTimeout(celebrationTimer);
    }

    lastActiveCountRef.current = activeCount;
  }, [tasks]);

  const fetchTodos = useCallback(async () => {
    try {
      const data = await apiFetch('/tasks', { method: 'GET' });
      setTasks(data);
      showStatus('Tasks refreshed!', 'success');
    } catch (error) {
      showStatus('Error fetching tasks: ' + error.message, 'error');
    }
  }, [apiFetch, setTasks, showStatus]);

  useEffect(() => {
    if (authToken) {
      const timer = setTimeout(() => {
        fetchTodos();
      }, 0);
      return () => clearTimeout(timer);
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
      const created = await apiFetch('/tasks', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setTasks([created, ...tasks]);
      e.target.reset();
      showStatus('Task saved successfully!', 'success');
    } catch (error) {
      showStatus('Error saving task: ' + error.message, 'error');
    }
  };

  const handleSaveEdit = async (todoId, title, description, completed) => {
    if (!title.trim() || !description.trim()) {
      showStatus('Title and description are required.', 'error');
      return;
    }

    try {
      const updated = await apiFetch(`/tasks/${todoId}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          completed
        })
      });
      setTasks(tasks.map((item) => (item.id === updated.id ? updated : item)));
      setEditingId(null);
      showStatus('Task updated successfully!', 'success');
    } catch (error) {
      showStatus(error.message, 'error');
    }
  };

  const handleToggleComplete = async (todo) => {
    try {
      const updated = await apiFetch(`/tasks/${todo.id}`, {
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
      setTasks(tasks.map((item) => (item.id === updated.id ? updated : item)));
      showStatus(
        updated.completed ? 'Task marked as completed!' : 'Task marked as active!',
        'success'
      );
    } catch (error) {
      showStatus(error.message, 'error');
    }
  };

  const handleDeleteTodo = async (todoId) => {
    try {
      await apiFetch(`/tasks/${todoId}`, { method: 'DELETE' });
      setTasks(tasks.filter((item) => item.id !== todoId));
      showStatus('Task deleted successfully!', 'success');
    } catch (error) {
      showStatus(error.message, 'error');
    }
  };

  const filteredAndSorted = tasks
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
    <section id="tasks-section" className="card" aria-labelledby="task-title">
      <CardHeader onRefresh={fetchTodos} isDisabled={filteredAndSorted.length === 0} />

      <StatusMsg message={statusMsg} type={statusType} />

      {!showNewForm && (
        <button
          className="btn btn-add-task"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}
          onClick={() => setShowNewForm(true)}
        >
          <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>+</span>
          Add New Task
        </button>
      )}

      {showNewForm && (
        <TaskForm
          onSubmit={handleCreateTodo}
          onCancel={() => setShowNewForm(false)}
        />
      )}

      <TaskListHeader
        filter={filter}
        sort={sort}
        onFilterChange={setFilter}
        onSortChange={setSort}
        isSortDisabled={filteredAndSorted.length <= 1}
      />

      <TaskList
        tasks={filteredAndSorted}
        editingId={editingId}
        onEdit={setEditingId}
        onToggleComplete={handleToggleComplete}
        onDelete={handleDeleteTodo}
        onSaveEdit={handleSaveEdit}
        onCancelEdit={() => setEditingId(null)}
      />

      <TaskConfetti isActive={showCelebration} onAnimationEnd={() => setShowCelebration(false)} />
    </section>
  );
}

export default TasksSection;
