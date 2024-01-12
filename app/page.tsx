"use client";
import React, { useState, useRef } from 'react';

interface MousePosition {
  x: number;
  y: number;
}

const WelcomePage: React.FC = () => {
  const [cursorPos, setCursorPos] = useState<MousePosition>({ x: 0, y: 0 });
  const textRef = useRef<HTMLHeadingElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (textRef.current) {
      const rect = textRef.current.getBoundingClientRect();
      setCursorPos({
        x: e.clientX - rect.left - rect.width / 200,
        y: e.clientY - rect.top - rect.height / 200,
      });
    }
  };

  return (
    <div
      className="flex justify-center items-center h-screen bg-black overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      <h1 ref={textRef} className="text-9xl font-bold relative px-4">
        <span
          className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500"
          style={{
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          Where's Religion?
        </span>
        <span
          className="absolute inset-0 bg-gradient-to-r from-pink-500 to-yellow-500"
          style={{
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            mask: `radial-gradient(circle at ${cursorPos.x}px ${cursorPos.y}px, transparent 1%, black 100%)`,
            WebkitMask: `radial-gradient(circle at ${cursorPos.x}px ${cursorPos.y}px, transparent 1%, black 100%)`,
          }}
        >
          Where's Religion?
        </span>
        Where's Religion?
      </h1>
    </div>
  );
};

export default WelcomePage;
