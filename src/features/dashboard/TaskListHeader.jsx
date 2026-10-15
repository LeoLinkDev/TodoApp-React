// Handles the header of the tasks list; filtering and sorting options.
import '../../styles/Tasks.css';

function TaskListHeader({ filter, sort, onFilterChange, onSortChange, isSortDisabled }) {
  return (
    <div className="list-header">
      <span>Items</span>
      <div className="filters" role="group" aria-label="Filter tasks">
        <button
          className={`chip${filter === 'all' ? ' active' : ''}`}
          type="button"
          onClick={() => onFilterChange('all')}
        >
          All
        </button>
        <button
          className={`chip${filter === 'active' ? ' active' : ''}`}
          type="button"
          onClick={() => onFilterChange('active')}
        >
          Active
        </button>
        <button
          className={`chip${filter === 'completed' ? ' active' : ''}`}
          type="button"
          onClick={() => onFilterChange('completed')}
        >
          Completed
        </button>
        <label className="sort-select">
          <span className="visually-hidden">Sort tasks</span>
          <span className="sort-prefix" aria-hidden="true">
            Sort:
          </span>
          <select value={sort} onChange={e => onSortChange(e.target.value)} disabled={isSortDisabled} aria-label="Sort tasks">
            <option value="created">Created</option>
            <option value="edited">Edited</option>
            <option value="title">Title</option>
            <option value="status">Status</option>
          </select>
        </label>
      </div>
    </div>
  );
}

export default TaskListHeader;
