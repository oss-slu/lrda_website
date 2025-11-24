"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Custom 404 Not Found page component
 * Displays when a user navigates to a non-existent route
 */
export default function NotFound() {
  return (
    <div
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-black"
      role="main"
      aria-label="404 Error Page"
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-3xl animate-float" />
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center px-6 py-12 max-w-4xl mx-auto">
        {/* 404 Number */}
        <div className="mb-8">
          <h1 className="text-9xl sm:text-[12rem] font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500 leading-none">
            404
          </h1>
        </div>

        {/* Error message */}
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
          Page Not Found
        </h2>
        <p className="text-xl sm:text-2xl text-blue-200 mb-4 max-w-2xl mx-auto">
          Oops! The page you're looking for seems to have wandered off the map.
        </p>
        <p className="text-lg text-blue-300/80 mb-12 max-w-xl mx-auto">
          Don't worry, we'll help you find your way back to exploring religious sites around the world.
        </p>

        {/* Action buttons */}
        <nav className="flex flex-col sm:flex-row gap-4 justify-center items-center" aria-label="Navigation options">
          <Link href="/" aria-label="Go to home page">
            <Button className="px-8 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg shadow-lg transition-all duration-300 hover:scale-105">
              Go Home
            </Button>
          </Link>
          <Link href="/lib/pages/map" aria-label="Go to map page">
            <Button
              variant="outline"
              className="px-8 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white border-white/30 font-semibold text-lg shadow-lg transition-all duration-300 hover:scale-105 backdrop-blur-sm"
            >
              Explore Map
            </Button>
          </Link>
        </nav>
      </div>
    </div>
  );
}

