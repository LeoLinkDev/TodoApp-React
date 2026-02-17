import { useState } from 'react';

function TodosItemEdit({ todo, onSave, onCancel }) {
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

export default TodosItemEdit;
