'use client'
import React, { useState } from 'react';

interface MousePosition {
  x: number;
  y: number;
}

const WelcomePage: React.FC = () => {
  const [cursorPos, setCursorPos] = useState<MousePosition>({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCursorPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  return (
    <div className="flex justify-center items-center h-screen"
         onMouseMove={handleMouseMove}>
      <h1 className="text-9xl font-bold relative">
        <span className="absolute inset-0"
              style={{
                background: 'linear-gradient(to right, cyan, blue)',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                mask: `radial-gradient(circle at ${cursorPos.x}px ${cursorPos.y}px, transparent 30%, black 100%)`,
                WebkitMask: `radial-gradient(circle at ${cursorPos.x}px ${cursorPos.y}px, transparent 30%, black 100%)`
              }}>
          Where's Religion?
        </span>
        Where's Religion?
      </h1>
    </div>
  );
};

export default WelcomePage;


