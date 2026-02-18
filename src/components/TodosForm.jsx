import { useState } from 'react';

function TodoForm({ onSubmit, onCancel }) {
  const [formState, setFormState] = useState({
    title: '',
    description: '',
    completed: false
  });
  const isDirty = formState.title || formState.description || formState.completed;

  return (
    <form
      id="todo-form"
      className="form"
      onSubmit={onSubmit}
      noValidate
      onInput={e => {
        const { name, value, type, checked } = e.target;
        setFormState(prev => ({
          ...prev,
          [name]: type === 'checkbox' ? checked : value
        }));
      }}
    >
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
        <button id="save-btn" className="btn" type="submit" disabled={!isDirty}>
          Save todo
        </button>
        <button
          id="cancel-btn"
          className="btn btn-ghost"
          type="button"
          onClick={e => {
            e.preventDefault();
            e.currentTarget.form.reset();
            setFormState({ title: '', description: '', completed: false });
            if (onCancel) onCancel();
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default TodoForm;
