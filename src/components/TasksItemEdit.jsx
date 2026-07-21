import { useRef } from 'react';

function TasksItemEdit({ todo, onSave, onCancel }) {
  const formRef = useRef(null);

  const handleSave = () => {
    if (!formRef.current) return;
    const form = formRef.current;
    const fd = new FormData(form);
    const title = (fd.get('title') || '').toString().trim();
    const description = (fd.get('description') || '').toString().trim();
    const completed = Boolean(fd.get('completed'));
    if (!title || !description) {
      // simple validation - do not save empty values
      return;
    }
    onSave(todo.id, title, description, completed);
  };

  return (
    <div>
      <form className="form" ref={formRef}>
        <label className="task-edit-label">
          Title
          <input name="title" defaultValue={todo.title} required />
        </label>
        <label className="task-edit-label">
          Description
          <textarea name="description" rows={3} defaultValue={todo.description} required />
        </label>
        <label className="checkbox">
          <input name="completed" type="checkbox" defaultChecked={todo.completed} /> Mark as complete
        </label>
        <div className="form-actions">
          <button type="button" className="btn" onClick={handleSave}>Save</button>
          <button type="button" className="btn btn-ghost" onClick={() => onCancel()}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

export default TasksItemEdit;
