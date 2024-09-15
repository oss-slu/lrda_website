"use client";
import React, { useState, useRef, useEffect } from "react";
import 'intro.js/introjs.css';  // Import intro.js CSS
import introJs from 'intro.js';  // Import intro.js

interface MousePosition {
  x: number;
  y: number;
}

const WelcomePage: React.FC = () => {
  const [cursorPos, setCursorPos] = useState<MousePosition>({ x: 0, y: 0 });
  const textRef = useRef<HTMLHeadingElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);

  // Ref for login button
  const loginButtonRef = useRef<HTMLButtonElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (textRef.current) {
      const rect = textRef.current.getBoundingClientRect();
      setCursorPos({
        x: e.clientX - rect.left - rect.width / 200,
        y: e.clientY - rect.top - rect.height / 200,
      });
    }
  };

  // Initialize Intro.js when the page loads
  useEffect(() => {
    if (loginButtonRef.current) {
      const intro = introJs();
      intro.setOptions({
        steps: [
          {
            element: loginButtonRef.current,  // Target the login button
            intro: "Click here to log in to your account."
          }
        ],
        showProgress: true,  // Option to show progress bar
        scrollToElement: true,  // Automatically scroll to element
      });
      
      intro.start();  // Start the intro tour
    }
  }, []);

  return (
    <div
      className="flex flex-col justify-center items-center h-[90vh] bg-black overflow-visible"
      onMouseMove={handleMouseMove}
      style={{ cursor: "url(/pin.png), auto" }}
    >
      {/* Container for "Where's Religion?" and its effects */}
      <div
        ref={textRef}
        className="relative px-2 pb-4 whitespace-nowrap"
        style={{ maxWidth: "100%" }}
      >
        {/* Layers for "Where's Religion?" */}
        <h1 className="text-9xl font-bold">
          <span
            className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500"
            style={{
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Where's Religion?
          </span>
          <span
            className="absolute inset-0 bg-gradient-to-r from-pink-500 to-yellow-500"
            style={{
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              mask: `radial-gradient(circle at ${cursorPos.x}px ${cursorPos.y}px, transparent 15px, black 30%)`,
              WebkitMask: `radial-gradient(circle at ${cursorPos.x}px ${cursorPos.y}px, transparent 15px, black 30%)`,
            }}
          >
            Where's Religion?
          </span>
          {/* 3D effect layer */}
          <span className="text-gray-800">Where's Religion?</span>
        </h1>
        {/* "Center on Lived Religion" text block */}
        <div
          className="relative px-1 text-2xl font-bold whitespace-nowrap"
          style={{ maxWidth: "100%" }}
        >
          <span
            className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500"
            style={{
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Center on Lived Religion (COLR)
          </span>
          <span
            className="absolute inset-0 bg-gradient-to-r from-pink-500 to-yellow-500"
            style={{
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              mask: `radial-gradient(circle at ${cursorPos.x}px ${cursorPos.y}px, transparent 15px, black 30%)`,
              WebkitMask: `radial-gradient(circle at ${cursorPos.x}px ${cursorPos.y}px, transparent 15px, black 30%)`,
            }}
          >
            Center on Lived Religion (COLR)
          </span>
          <span className="text-gray-800">Center on Lived Religion (COLR)</span>
        </div>
      </div>
      
      {/* Add Login Button and reference it */}
      <button 
        ref={loginButtonRef}
        className="mt-10 px-4 py-2 bg-blue-500 text-white rounded-lg"
      >
        Log In
      </button>
    </div>
  );
};

export default WelcomePage;
