"use client";
import React from "react";
import Image from "next/image";
import { useReveal, motionVariants } from "@/app/lib/utils/motion";
import { IconLink } from "@/app/lib/components/IconLink";

const ANIMATE_CLASS = "animate-fadeIn opacity-0";

function WelcomeHero() {
  const { ref, isVisible } = useReveal<HTMLDivElement>({ rootMargin: "120px 0px", threshold: 0.1 });
  return (
    <section
      ref={ref}
      className={`relative bg-cover bg-center bg-no-repeat h-screen flex items-center justify-center overflow-hidden ${motionVariants.fadeIn}`}
      data-reveal={isVisible}
      style={{ backgroundImage: 'url("/splash.png")' }}
    >
      {/* Gradient overlay with modern feel */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-blue-600/85 to-black/70" />

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <div className="relative text-center text-white p-8 sm:p-12 max-w-4xl z-10">
        <h1 className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tight leading-tight md:leading-[1.1] mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-purple-200 pb-2">
          Where's Religion?
        </h1>
        <p className="mt-6 text-xl sm:text-2xl md:text-3xl font-light text-white/95 leading-relaxed max-w-2xl mx-auto">
          The platform advancing the study of <span className="font-semibold text-blue-300">lived religion</span>
        </p>
        <div className="inline-block mt-8 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-sm font-medium">
          Open Source · Collaborative · Global
        </div>
      </div>
    </section>
  );
}

export default function WelcomePage() {
  return (
    <>
      <WelcomeHero />

      <div className="relative flex flex-col lg:flex-row min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        {/* Left Side - Content */}
        <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-16 lg:py-24">
          <div className="max-w-2xl">
            {/* Main heading */}
            <h1
              className={`text-5xl sm:text-6xl lg:text-7xl font-black text-gray-900 mb-6 leading-tight ${ANIMATE_CLASS}`}
              style={{ animationDelay: "0.2s" }}
            >
              Map the world's{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-blue-500 to-blue-700">
                religious landscape
              </span>
            </h1>

            {/* Subheading */}
            <p className={`text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed ${ANIMATE_CLASS}`} style={{ animationDelay: "0.3s" }}>
              Document, share, and explore religious sites anywhere. Built for researchers, by researchers.
            </p>

            {/* Feature pills */}
            <div className={`flex flex-wrap gap-3 mb-20 ${ANIMATE_CLASS}`} style={{ animationDelay: "0.4s" }}>
              {["Global Mapping", "Data Collection", "Open Source"].map((feature, i) => (
                <div
                  key={i}
                  className="cursor-default px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 shadow-sm hover:shadow-md transition-shadow"
                >
                  {feature}
                </div>
              ))}
            </div>

            {/* App downloads */}
            <div className="flex flex-wrap gap-3 mt-12">
              <a
                href="https://apps.apple.com/us/app/wheres-religion/id6469009793"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-lg bg-white shadow-md hover:shadow-lg transition-all border border-gray-200 px-0 py-0"
                style={{ height: 40 }}
                aria-label="Get the app on the Apple App Store"
              >
                <Image
                  src="/app_store_img.svg"
                  alt="Apple App Store"
                  width={120}
                  height={40}
                  style={{ height: 40, width: "auto" }}
                  priority
                />
              </a>
              <a
                href="https://play.google.com/store/apps/details?id=register.edu.slu.cs.oss.lrda&pcampaignid=web_share"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-lg bg-white shadow-md hover:shadow-lg transition-all border border-gray-200 px-0 py-0 overflow-hidden"
                style={{ height: 40 }}
                aria-label="Get the app on Google Play"
              >
                <Image
                  src="/01googleplay.svg"
                  alt="Google Play Store"
                  width={135}
                  height={40}
                  style={{ transform: "scale(1.15)" }}
                  priority
                />
              </a>
            </div>
          </div>
        </div>

        {/* Right Side - App Showcase */}
        <div className="flex-1 flex items-center justify-center relative py-16 lg:py-0 overflow-hidden">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 via-purple-100/30 to-pink-100/50" />

          {/* Floating elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-float" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-float-delayed" />
          </div>

          {/* Phone mockup */}
          <div className="relative z-10 flex items-center justify-center">
            <div className="relative w-64 h-[500px] sm:w-80 sm:h-[600px] lg:w-96 lg:h-[700px]">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-[3rem] blur-2xl scale-105" />

              {/* Phone container with glass effect */}
              <div className="relative w-full h-full backdrop-blur-sm rounded-[3rem] shadow-2xl border border-white/50 overflow-hidden flex items-center justify-center">
                <Image
                  src="/mobile_image_WR.png"
                  alt="Where's Religion App"
                  width={600}
                  height={1000}
                  style={{
                    objectFit: "contain",
                    objectPosition: "center",
                    width: "100%",
                    height: "100%",
                    transform: "scale(3)",
                  }}
                  priority
                />
              </div>

              {/* Floating accent elements */}
              <div className="absolute -right-8 top-20 w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl rotate-12 opacity-80 animate-float shadow-xl" />
              <div className="absolute -left-8 bottom-32 w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl -rotate-12 opacity-80 animate-float-delayed shadow-xl" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
