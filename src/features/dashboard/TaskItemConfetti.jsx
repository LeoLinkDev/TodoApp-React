// Handles the confetti effect for single tasks.
import '../../styles/Tasks.css';

const colors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6'];

const pseudoRandom = (seed) => {
  const value = Math.sin(seed) * 10000;
  return value - Math.floor(value);
};

function TaskItemConfetti({ isActive }) {
  if (!isActive) return null;

  return (
    <div className="item-confetti" aria-hidden="true">
      {Array.from({ length: 24 }, (_, index) => (
        <span
          key={index}
          className="item-confetti-piece"
          style={{
            left: `${pseudoRandom(index + 1) * 100}%`,
            background: colors[index % colors.length],
            animationDuration: `${1.5 + pseudoRandom(index + 101)}s`,
            animationDelay: `${pseudoRandom(index + 201) * 0.2}s`
          }}
        />
      ))}
    </div>
  );
}

export default TaskItemConfetti;
