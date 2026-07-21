import { useState, useEffect } from 'react';
import TasksItemActions from './TasksItemActions';
import TasksItemConfetti from './TasksItemConfetti';

function TasksItem({ todo, onEdit, onToggleComplete, onDelete }) {
  const [showItemConfetti, setShowItemConfetti] = useState(false);

  const handleToggleClick = () => {
    if (!todo.completed) {
      // Show confetti when marking as complete
      setShowItemConfetti(true);
    }
    onToggleComplete();
  };

  useEffect(() => {
    if (showItemConfetti) {
      const timer = setTimeout(() => setShowItemConfetti(false), 2200);
      return () => clearTimeout(timer);
    }
  }, [showItemConfetti]);

  return (
    <li className={`task-item${todo.completed ? ' completed' : ''}`}>
      <TasksItemConfetti isActive={showItemConfetti} />
      
      <div className="task-title">
        <div className="task-title-main">
          <h3>{todo.title}</h3>
        </div>
        <span className="task-meta task-title-status">
          {todo.completed ? 'Completed' : 'Active'}
        </span>
      </div>
      <p>{todo.description}</p>
      <p className="task-meta">Created {new Date(todo.createdAt).toLocaleString()}</p>
      <p className="task-meta task-meta-edited">
        {todo.editedAt
          ? `Edited ${new Date(todo.editedAt).toLocaleString()}`
          : 'Edited —'}
      </p>
      <p className="task-meta task-meta-edited">
        {todo.completedAt
          ? `Completed ${new Date(todo.completedAt).toLocaleString()}`
          : 'Completed —'}
      </p>
      <TasksItemActions
        todo={todo}
        onEdit={onEdit}
        onToggleComplete={handleToggleClick}
        onDelete={onDelete}
      />
    </li>
  );
}

export default TasksItem;
