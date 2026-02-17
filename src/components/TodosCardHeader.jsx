function CardHeader({ onRefresh, isDisabled }) {
  return (
    <div className="card-header">
      <h2 id="todos-title">Your Todos</h2>
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

export default CardHeader;
