import { useState, useEffect } from 'react';
import TodosItemActions from './TodosItemActions';
import TodosItemConfetti from './TodosItemConfetti';

function TodosItem({ todo, onEdit, onToggleComplete, onDelete }) {
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
    <li className={`todo-item${todo.completed ? ' completed' : ''}`}>
      <TodosItemConfetti isActive={showItemConfetti} />
      
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
      <TodosItemActions
        todo={todo}
        onEdit={onEdit}
        onToggleComplete={handleToggleClick}
        onDelete={onDelete}
      />
    </li>
  );
}

export default TodosItem;
