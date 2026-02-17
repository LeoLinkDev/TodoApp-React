import { useEffect, useRef } from 'react';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import Header from './components/Header';
import Footer from './components/Footer';
import Auth from './components/Auth';
import './App.css';
import './css/Todos.css';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const mainRef = useRef(null);

  const initTodosApp = (container) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const STORAGE_KEY = 'todoAppState';

    const getAuthToken = () => {
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
    };

    const elements = {
      todoForm: container.querySelector('#todo-form'),
      todoList: container.querySelector('#todo-list'),
      refreshBtn: container.querySelector('#refresh-btn'),
      cancelEditBtn: container.querySelector('#cancel-edit-btn'),
      saveBtn: container.querySelector('#save-btn'),
      sortSelect: container.querySelector('#sort-select'),
      filterButtons: Array.from(container.querySelectorAll('.chip')),
      confettiOverlay: container.querySelector('#confetti-overlay'),
      confettiContainer: container.querySelector('#confetti-container'),
      statusMsg: container.querySelector('#todo-msg')
    };

    const setTodoStatus = (message, type = 'default') => {
      if (!elements.statusMsg) return;
      elements.statusMsg.textContent = message;
      elements.statusMsg.classList.toggle('success', type === 'success');
      elements.statusMsg.style.color = type === 'error' ? '#ef4444' : '';
    };

    if (!elements.todoForm) return;

    const state = {
      todos: [],
      filter: 'all',
      sort: 'created',
      editingId: null,
      lastSavedId: null,
      celebrationShown: false,
      lastActiveCount: 0,
      lastCompletedCount: 0,
      justCompletedId: null
    };

    const saveState = () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        todos: state.todos,
        filter: state.filter,
        sort: state.sort
      }));
    };

    const loadState = () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      try {
        const parsed = JSON.parse(saved);
        state.todos = Array.isArray(parsed.todos) ? parsed.todos : [];
        state.filter = parsed.filter || 'all';
        state.sort = parsed.sort || 'created';
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    };

    const apiFetch = async (path, options = {}) => {
      const authToken = getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers
      };

      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      } else {
        console.warn('No auth token available for request to', path);
        throw new Error('Not authenticated');
      }

      console.log('Fetching:', API_URL + path, 'with headers:', Object.keys(headers));
      
      const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        console.error('API Error:', error);
        throw new Error(error.error || 'Request failed');

      }

      if (response.status === 204) {
        return null;
      }

      return response.json();
    };

    const renderTodos = () => {
      const filter = state.filter;
      const items = state.todos
        .slice()
        .sort((a, b) => {
          if (state.sort === 'created') {
            return new Date(b.createdAt) - new Date(a.createdAt);
          }
          if (state.sort === 'edited') {
            const aEdited = a.editedAt ? new Date(a.editedAt) : new Date(0);
            const bEdited = b.editedAt ? new Date(b.editedAt) : new Date(0);
            return bEdited - aEdited;
          }
          if (state.sort === 'title') {
            return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
          }
          if (state.sort === 'status') {
            return Number(a.completed) - Number(b.completed);
          }
          return 0;
        })
        .filter((todo) => {
          if (filter === 'completed') return todo.completed;
          if (filter === 'active') return !todo.completed;
          return true;
        });

      if (elements.sortSelect) {
        elements.sortSelect.disabled = items.length <= 1;
      }

      elements.refreshBtn.disabled = items.length === 0;
      elements.todoList.innerHTML = '';

      if (items.length === 0) {
        const empty = document.createElement('li');
        empty.className = 'todo-item';
        empty.textContent = 'No todos yet. Add one above!';
        elements.todoList.appendChild(empty);
        return;
      }

      items.forEach((todo) => {
        if (todo.id === state.editingId) {
          // Render inline edit form for this todo
          const li = document.createElement('li');
          li.className = 'todo-item editing';

          const titleLabel = document.createElement('label');
          titleLabel.className = 'todo-edit-label';
          titleLabel.textContent = 'Title';
          const titleInput = document.createElement('input');
          titleInput.type = 'text';
          titleInput.value = todo.title;
          titleInput.required = true;
          titleLabel.appendChild(titleInput);

          const descriptionLabel = document.createElement('label');
          descriptionLabel.className = 'todo-edit-label';
          descriptionLabel.textContent = 'Description';
          const descriptionInput = document.createElement('textarea');
          descriptionInput.rows = 3;
          descriptionInput.value = todo.description;
          descriptionInput.required = true;
          descriptionLabel.appendChild(descriptionInput);

          const checkboxLabel = document.createElement('label');
          checkboxLabel.className = 'checkbox';
          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.checked = todo.completed;
          checkboxLabel.append(checkbox, document.createTextNode(' Mark as complete'));

          const meta = document.createElement('p');
          meta.className = 'todo-meta';
          meta.textContent = `Created ${new Date(todo.createdAt).toLocaleString()}`;

          const actions = document.createElement('div');
          actions.className = 'todo-actions';

          const saveBtn = document.createElement('button');
          saveBtn.type = 'button';
          saveBtn.textContent = 'Save';
          saveBtn.addEventListener('click', async () => {
            const payload = {
              title: titleInput.value.trim(),
              description: descriptionInput.value.trim(),
              completed: checkbox.checked
            };

            if (!payload.title || !payload.description) {
              setTodoStatus('Title and description are required.', 'error');
              return;
            }

            try {
              const updated = await apiFetch(`/todos/${todo.id}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
              });
              state.todos = state.todos.map((item) => (item.id === updated.id ? updated : item));
              state.editingId = null;
              saveState();
              renderTodos();
              setTodoStatus('Todo updated successfully!', 'success');
            } catch (error) {
              setTodoStatus(error.message, 'error');
            }
          });

          const cancelBtn = document.createElement('button');
          cancelBtn.type = 'button';
          cancelBtn.textContent = 'Cancel';
          cancelBtn.addEventListener('click', () => {
            state.editingId = null;
            renderTodos();
          });

          actions.append(saveBtn, cancelBtn);
          li.append(titleLabel, descriptionLabel, checkboxLabel, meta, actions);
          elements.todoList.appendChild(li);
          return;
        }

        const li = document.createElement('li');
        li.className = `todo-item${todo.completed ? ' completed' : ''}`;

        const header = document.createElement('div');
        header.className = 'todo-title';

        const titleWrap = document.createElement('div');
        titleWrap.className = 'todo-title-main';

        const title = document.createElement('h3');
        title.textContent = todo.title;
        titleWrap.appendChild(title);

        const badge = document.createElement('span');
        badge.className = 'todo-meta todo-title-status';
        badge.textContent = todo.completed ? 'Completed' : 'Active';

        header.appendChild(titleWrap);
        header.appendChild(badge);

        const description = document.createElement('p');
        description.textContent = todo.description;

        const meta = document.createElement('p');
        meta.className = 'todo-meta';
        meta.textContent = `Created ${new Date(todo.createdAt).toLocaleString()}`;

        const edited = document.createElement('p');
        edited.className = 'todo-meta todo-meta-edited';
        edited.textContent = todo.editedAt
          ? `Edited ${new Date(todo.editedAt).toLocaleString()}`
          : 'Edited —';

        const completedAt = document.createElement('p');
        completedAt.className = 'todo-meta todo-meta-edited';
        completedAt.textContent = todo.completedAt
          ? `Completed ${new Date(todo.completedAt).toLocaleString()}`
          : 'Completed —';

        const actions = document.createElement('div');
        actions.className = 'todo-actions';

        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.textContent = 'Edit';
        editBtn.addEventListener('click', () => {
          state.editingId = todo.id;
          renderTodos();
        });

        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.textContent = todo.completed ? 'Mark active' : 'Mark complete';
        toggleBtn.addEventListener('click', async () => {
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
            state.todos = state.todos.map((item) => (item.id === updated.id ? updated : item));
            saveState();
            renderTodos();
            setTodoStatus(
              updated.completed ? 'Todo marked as completed!' : 'Todo marked as active!',
              'success'
            );
          } catch (error) {
            setTodoStatus(error.message, 'error');
          }
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'danger';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', async () => {
          try {
            await apiFetch(`/todos/${todo.id}`, { method: 'DELETE' });
            state.todos = state.todos.filter((item) => item.id !== todo.id);
            saveState();
            renderTodos();
            setTodoStatus('Todo deleted successfully!', 'success');
          } catch (error) {
            setTodoStatus(error.message, 'error');
          }
        });

        actions.append(editBtn, toggleBtn, deleteBtn);
        li.append(header, description, meta, edited, completedAt, actions);
        elements.todoList.appendChild(li);
      });
    };

    const fetchTodos = async () => {
      const authToken = getAuthToken();
      if (!authToken) {
        console.warn('Cannot fetch todos: not authenticated');
        return;
      }
      try {
        console.log('Fetching todos...');
        const todos = await apiFetch('/todos', { method: 'GET' });
        console.log('Todos fetched:', todos);
        state.todos = todos;
        saveState();
        renderTodos();
        setTodoStatus('Todos refreshed!', 'success');
      } catch (error) {
        console.error('Fetch error:', error);
        setTodoStatus('Error fetching todos: ' + error.message, 'error');
      }
    };

    const setFilter = (filter) => {
      state.filter = filter;
      elements.filterButtons.forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
      });
      saveState();
      renderTodos();
    };

    // Event listeners
    const updateButtonState = () => {
      const titleValue = elements.todoForm.title.value.trim();
      const descriptionValue = elements.todoForm.description.value.trim();
      const hasContent = Boolean(titleValue || descriptionValue);
      elements.saveBtn.disabled = !hasContent;
      elements.cancelEditBtn.disabled = !hasContent;
    };

    elements.todoForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(elements.todoForm);
      const payload = {
        title: formData.get('title').trim(),
        description: formData.get('description').trim(),
        completed: elements.todoForm.completed.checked
      };

      if (!payload.title || !payload.description) {
        setTodoStatus('Title and description are required.', 'error');
        return;
      }

      try {
        console.log('Saving todo:', payload);
        const created = await apiFetch('/todos', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        console.log('Todo created:', created);
        state.todos.unshift(created);
        saveState();
        elements.todoForm.reset();
        updateButtonState();
        renderTodos();
        setTodoStatus('Todo saved successfully!', 'success');
      } catch (error) {
        console.error('Save error:', error);
        setTodoStatus('Error saving todo: ' + error.message, 'error');
      }
    });

    elements.todoForm.addEventListener('input', updateButtonState);

    elements.cancelEditBtn.addEventListener('click', () => {
      elements.todoForm.reset();
      updateButtonState();
    });

    elements.refreshBtn.addEventListener('click', fetchTodos);

    elements.filterButtons.forEach((btn) => {
      btn.addEventListener('click', () => setFilter(btn.dataset.filter));
    });

    elements.sortSelect.addEventListener('change', (event) => {
      state.sort = event.target.value;
      saveState();
      renderTodos();
    });

    // Initialize
    loadState();
    setFilter(state.filter);
    elements.sortSelect.value = state.sort;
    fetchTodos();
  };

  useEffect(() => {
    if (isAuthenticated && mainRef.current) {
      // Initialize todos functionality when authenticated
      initTodosApp(mainRef.current);
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="container" ref={mainRef}>
        {!isAuthenticated ? (
          <section className="grid" aria-label="User access">
            <Auth />
          </section>
        ) : (
          <>
            <section id="todos-section" className="card" aria-labelledby="todos-title">
              <div className="card-header">
                <h2 id="todos-title">Your Todos</h2>
                <button id="refresh-btn" className="btn btn-ghost" type="button" disabled>
                  Refresh
                </button>
              </div>

              <div id="todo-msg" className="status-msg" role="status" aria-live="polite"></div>
              
              <form id="todo-form" className="form" noValidate>
                <label>
                  Title
                  <input name="title" type="text" required />
                </label>
                <label>
                  Description
                  <textarea name="description" rows="3" required></textarea>
                </label>
                <label className="checkbox">
                  <input name="completed" type="checkbox" />
                  Mark as complete
                </label>
                <div className="form-actions">
                  <button id="save-btn" className="btn" type="submit" disabled>
                    Save todo
                  </button>
                  <button id="cancel-edit-btn" className="btn btn-ghost" type="button" disabled>
                    Cancel
                  </button>
                </div>
              </form>

              <div className="list-header">
                <span>Items</span>
                <div className="filters" role="group" aria-label="Filter todos">
                  <button className="chip" data-filter="all" type="button">
                    All
                  </button>
                  <button className="chip" data-filter="active" type="button">
                    Active
                  </button>
                  <button className="chip" data-filter="completed" type="button">
                    Completed
                  </button>
                  <label className="sort-select">
                    <span className="visually-hidden">Sort todos</span>
                    <span className="sort-prefix" aria-hidden="true">
                      Sort:
                    </span>
                    <select id="sort-select" aria-label="Sort todos">
                      <option value="created">Created</option>
                      <option value="edited">Edited</option>
                      <option value="title">Title</option>
                      <option value="status">Status</option>
                    </select>
                  </label>
                </div>
              </div>

              <ul id="todo-list" className="todo-list" aria-live="polite"></ul>
            </section>

            <div id="confetti-overlay" className="confetti-overlay" aria-hidden="true">
              <div className="confetti-message" role="status" aria-live="polite">
                Congratulations!
              </div>
              <div id="confetti-container" className="confetti-container"></div>
            </div>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
