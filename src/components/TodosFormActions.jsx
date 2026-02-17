function TodoFormActions({ onCancel }) {
  return (
    <div className="form-actions">
      <button id="save-btn" className="btn" type="submit">
        Save todo
      </button>
      <button
        id="cancel-edit-btn"
        className="btn btn-ghost"
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.currentTarget.form.reset();
          onCancel();
        }}
      >
        Cancel
      </button>
    </div>
  );
}

export default TodoFormActions;
