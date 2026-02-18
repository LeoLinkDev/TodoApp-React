import { useState, useEffect } from 'react';

const colors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6'];

function TodosConfetti({ isActive, onAnimationEnd }) {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    if (!isActive) {
      setPieces([]);
      return;
    }

    // Generate confetti pieces
    const generatedPieces = Array.from({ length: 80 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      background: colors[i % colors.length],
      duration: 2.5 + Math.random() * 1.5,
      delay: Math.random() * 0.4,
      rotation: Math.random() * 360
    }));

    setPieces(generatedPieces);

    // Auto-hide after animation completes
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

export default TodosConfetti;
