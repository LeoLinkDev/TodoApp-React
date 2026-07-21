function TasksCardHeader({ onRefresh, isDisabled }) {
  return (
    <div className="card-header">
      <h2 id="tasks-title">Your Tasks</h2>
      <button
        id="refresh-btn"
        className="btn btn-ghost"
        type="button"
        disabled={isDisabled}
        onClick={onRefresh}
      >
        Refresh
      </button>
    </div>
  );
}

export default TasksCardHeader;
