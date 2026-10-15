// Handles single task actions; editing, marking as complete, and deleting.
import './TaskItem.css';

function TaskItemActions({ todo, onEdit, onToggleComplete, onDelete }) {
  return (
    <div className="task-actions">
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
  );
}

export default TaskItemActions;
