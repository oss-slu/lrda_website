"use client";
import React from "react";
import Image from "next/image";

const WelcomePage: React.FC = () => {
  return (
    <div className="flex flex-col md:flex-row flex h-screen">
      {/* Left Side - Text */}
      <div className="flex-1 flex flex-col justify-start bg-gray-900">
        {/* Nested content with padding */}
        <div className="pt-20 px-8 md:px-16">
          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6" style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.3)" }}>
          Where's Religion?
          </h1>
          {/* Sub-description */}
          <p className="text-md md:text-xl text-gray-500 max-w-xl">
            A revolutionary platform to support in-person research, remote data entry, media sharing, and mapping.
          </p>
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="flex-1 relative h-80 md:h-auto">
        <Image
          src="/splash.png"
          alt="Right Side Image"
          layout="fill"
          objectFit="cover"
        />
      </div>
    </div>
  );
};

export default WelcomePage;


