import { useEffect, useMemo } from 'react';

const colors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6'];

const pseudoRandom = (seed) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

function TasksConfetti({ isActive, onAnimationEnd }) {
  const pieces = useMemo(() => {
    if (!isActive) {
      return [];
    }

    return Array.from({ length: 80 }, (_, i) => ({
      id: i,
      left: pseudoRandom(i + 1) * 100,
      background: colors[i % colors.length],
      duration: 2.5 + pseudoRandom(i + 101) * 1.5,
      delay: pseudoRandom(i + 201) * 0.4,
      rotation: pseudoRandom(i + 301) * 360
    }));
  }, [isActive]);

  useEffect(() => {
    if (!isActive) {
      return undefined;
    }

    const timer = setTimeout(() => {
      onAnimationEnd();
    }, 2200);

    return () => clearTimeout(timer);
  }, [isActive, onAnimationEnd]);

  return (
    <div
      id="confetti-overlay"
      className={`confetti-overlay${isActive ? ' is-active' : ''}`}
      aria-hidden="true"
    >
      <div className="confetti-message" role="status" aria-live="polite">
        Congratulations!
      </div>
      <div id="confetti-container" className="confetti-container">
        {pieces.map((piece) => (
          <span
            key={piece.id}
            className="confetti-piece"
            style={{
              left: `${piece.left}%`,
              background: piece.background,
              animationDuration: `${piece.duration}s`,
              animationDelay: `${piece.delay}s`,
              transform: `rotate(${piece.rotation}deg)`
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default TasksConfetti;
