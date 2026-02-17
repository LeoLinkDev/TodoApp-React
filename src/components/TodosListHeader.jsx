function TodosListHeader({ filter, sort, onFilterChange, onSortChange, isSortDisabled }) {
  return (
    <div className="list-header">
      <span>Items</span>
      <div className="filters" role="group" aria-label="Filter todos">
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
          <span className="visually-hidden">Sort todos</span>
          <span className="sort-prefix" aria-hidden="true">
            Sort:
          </span>
          <select
            id="sort-select"
            aria-label="Sort todos"
            value={sort}
            onChange={(e) => onSortChange(e.target.value)}
            disabled={isSortDisabled}
          >
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

export default TodosListHeader;
