"use client";
import React from "react";
import Image from "next/image";

const WelcomePage: React.FC = () => {
  return (
    <div className="relative flex justify-center items-center h-[90vh] overflow-hidden">
      {/* Centered Background Image */}
      <div className="absolute inset-0 flex justify-center items-center">
        <Image
          src="/splash.png"
          alt="Background Image"
          layout="fill"
          objectFit="cover"
          className="z-[-1]"
        />
      </div>

      {/* Centered "Where's Religion?" Text */}
      <div className="text-center">
        <h1 className="text-black text-9xl font-extrabold">Where's Religion?</h1>
      </div>
    </div>
  );
};

export default WelcomePage;
