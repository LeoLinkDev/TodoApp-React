import TasksItem from './TasksItem';
import TasksItemEdit from './TasksItemEdit';

function TasksList({
  tasks,
  editingId,
  onEdit,
  onToggleComplete,
  onDelete,
  onSaveEdit,
  onCancelEdit
}) {
  return (
    <ul id="task-list" className="task-list" aria-live="polite">
      {tasks.length === 0 ? (
        <li className="task-item">No tasks yet. Add one above!</li>
      ) : (
        tasks.map((todo) => {
          if (todo.id === editingId) {
            return (
              <TasksItemEdit
                key={todo.id}
                todo={todo}
                onSave={onSaveEdit}
                onCancel={onCancelEdit}
              />
            );
          }
          return (
            <TasksItem
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

export default TasksList;
