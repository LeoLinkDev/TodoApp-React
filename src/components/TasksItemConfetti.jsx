function TasksItemConfetti({ isActive }) {
  if (!isActive) return null;
  return (
    <div className="item-confetti" aria-hidden="true">
      {/* confetti pieces rendered via CSS/JS elsewhere */}
    </div>
  );
}

export default TasksItemConfetti;
