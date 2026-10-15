// Handles the form's task creation and editing; title, description, and completion status.
import { useState } from 'react';
// import '../../styles/Tasks.css';
import './TaskForm.css';

function TaskForm({ onSubmit, onCancel }) {
  const [formState, setFormState] = useState({
    title: '',
    description: '',
    completed: false
  });

  const isDirty = Boolean(formState.title || formState.description || formState.completed);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    if (onSubmit) return onSubmit(e);
  };

  const handleCancel = (e) => {
    e.preventDefault();
    setFormState({ title: '', description: '', completed: false });
    if (onCancel) onCancel();
  };

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <label>
        Title
        <input name="title" type="text" required value={formState.title} onChange={handleChange} />
      </label>
      <label>
        Description
        <textarea name="description" rows="3" required value={formState.description} onChange={handleChange}></textarea>
      </label>
      <label className="checkbox">
        <input name="completed" type="checkbox" checked={formState.completed} onChange={handleChange} />
        Mark as complete
      </label>
      <div className="form-actions">
        <button className="btn" type="submit" disabled={!isDirty}>
          Save task
        </button>
        <button className="btn btn-ghost" type="button" onClick={handleCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export default TaskForm;
