import TodosFormActions from './TodosFormActions';

function TodoForm({ onSubmit, onCancel }) {
  return (
    <form id="todo-form" className="form" onSubmit={onSubmit} noValidate>
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
      <TodosFormActions onCancel={onCancel} />
    </form>
  );
}

export default TodoForm;
