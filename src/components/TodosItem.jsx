import TodosItemActions from './TodosItemActions';

function TodosItem({ todo, onEdit, onToggleComplete, onDelete }) {
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
      <TodosItemActions
        todo={todo}
        onEdit={onEdit}
        onToggleComplete={onToggleComplete}
        onDelete={onDelete}
      />
    </li>
  );
}

export default TodosItem;
