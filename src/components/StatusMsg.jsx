function StatusMsg({ message, type }) {
  return (
    <div
      id="todo-msg"
      className={`status-msg${type === 'success' ? ' success' : ''}`}
      role="status"
      aria-live="polite"
      style={{
        color: type === 'error' ? '#ef4444' : ''
      }}
    >
      {message}
    </div>
  );
}

export default StatusMsg;
