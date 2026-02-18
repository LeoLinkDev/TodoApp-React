import { useState, useEffect } from 'react';

const colors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#22c55e', '#0ea5e9'];

function TodosItemConfetti({ isActive }) {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    if (!isActive) return;

    // Generate confetti pieces for item celebration
    const generatedPieces = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      background: colors[i % colors.length],
      duration: 0.3 + Math.random() * 1.2,
      delay: Math.random() * 0.35,
      rotation: Math.random() * 360
    }));

    setPieces(generatedPieces);

    // Auto-clean up after animation completes
    const maxDuration = Math.max(...generatedPieces.map(p => p.duration + p.delay));
    const timer = setTimeout(() => {
      setPieces([]);
    }, maxDuration * 1000 + 200);

    return () => clearTimeout(timer);
  }, [isActive]);

  if (!isActive || pieces.length === 0) {
    return null;
  }

  return (
    <div className="item-confetti">
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className="item-confetti-piece"
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
  );
}

export default TodosItemConfetti;
