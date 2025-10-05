"use client";
import React from "react";
import Image from "next/image";

// Define the core animation class
const ANIMATE_CLASS = "animate-fadeIn opacity-0";

const WelcomePage: React.FC = () => {
  return (
    <div className="flex flex-col md:flex-row h-screen">
      {/* Left Side - Text */}
      <div className="flex-1 flex flex-col justify-start bg-gray-900">
        {/* Nested content with padding */}
        <div className="pt-20 px-8 md:px-16">
          <h1
            className={`text-5xl md:text-7xl font-extrabold text-white mb-6 ${ANIMATE_CLASS}`}
            style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.3)", animationDelay: "0.2s" }}
          >
            Where's Religion?
          </h1>
          {/* Sub-description */}
          <p className={`text-md md:text-xl text-gray-400 max-w-xl ${ANIMATE_CLASS}`} style={{ animationDelay: "0.4s" }}>
            A revolutionary platform to support in-person research, remote data entry, media sharing, and mapping.
          </p>

          {/* Section for App Store Links */}
          <div className={`mt-8 ${ANIMATE_CLASS}`} style={{ animationDelay: "0.6s" }}>
            <p className={"text-md md:text-md text-gray-400 max-w-xl"}>Get our mobile app here:</p>
            <div className="flex space-x-2 items-center mt-4">
              {/* Apple App Store Link */}
              <a
                href="https://apps.apple.com/us/app/wheres-religion/id6469009793"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Get the app on the Apple App Store"
              >
                <Image src="/app_store_img.svg" alt="Apple App Store" width={135} height={40} />
              </a>
              {/* Google Play Store Link */}
              <a
                href="https://play.google.com/store/apps/details?id=register.edu.slu.cs.oss.lrda&pcampaignid=web_share"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Get the app on Google Play"
              >
                <Image src="/01googleplay.svg" alt="Google Play Store" width={135} height={40} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="flex-1 relative h-80 md:h-auto animate-fadeIn overflow-hidden">
        <Image src="/splash.png" alt="Right Side Image" layout="fill" objectFit="cover" className="animate-zoom-slow" />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent"></div>
      </div>
    </div>
  );
};

export default WelcomePage;
