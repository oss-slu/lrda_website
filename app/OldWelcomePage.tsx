"use client";
import React from "react";
import Image from "next/image";

export default function OldWelcomePage() {
  return (
    <div className="relative flex justify-center items-center h-full overflow-hidden">
      {/* Centered Background Image */}
      <div className="absolute inset-0 flex justify-center items-center">
        <Image src="/splash.png" alt="Background Image" layout="fill" objectFit="cover" className="z-[-1]" />
      </div>

      {/* Centered "Where's Religion?" Text */}
      <div className="text-center">
        <h1
          className="text-black text-9xl font-extrabold"
          style={{
            textShadow: "2px 2px 4px rgba(255, 255, 255, 0.8)",
          }}
        >
          Where's Religion?
        </h1>
      </div>
    </div>
  );
}
