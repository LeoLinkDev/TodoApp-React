// Handles the task card's header, title, and refresh button.
import '../../styles/Tasks.css';

function TaskCardHeader({ onRefresh, isDisabled }) {
  return (
    <div className="card-header">
      <h2 id="task-title">Your Tasks</h2>
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

export default TaskCardHeader;
