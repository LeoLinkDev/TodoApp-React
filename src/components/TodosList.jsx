import TodosItem from './TodosItem';
import TodosItemEdit from './TodosItemEdit';

function TodosList({
  todos,
  editingId,
  onEdit,
  onToggleComplete,
  onDelete,
  onSaveEdit,
  onCancelEdit
}) {
  return (
    <ul id="todo-list" className="todo-list" aria-live="polite">
      {todos.length === 0 ? (
        <li className="todo-item">No todos yet. Add one above!</li>
      ) : (
        todos.map((todo) => {
          if (todo.id === editingId) {
            return (
              <TodosItemEdit
                key={todo.id}
                todo={todo}
                onSave={onSaveEdit}
                onCancel={onCancelEdit}
              />
            );
          }
          return (
            <TodosItem
              key={todo.id}
              todo={todo}
              onEdit={() => onEdit(todo.id)}
              onToggleComplete={() => onToggleComplete(todo)}
              onDelete={() => onDelete(todo.id)}
            />
          );
        })
      )}
    </ul>
  );
}

export default TodosList;
