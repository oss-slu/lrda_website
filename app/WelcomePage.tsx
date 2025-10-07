"use client";
import React from "react";
import Image from "next/image";
import { useReveal, motionVariants } from "@/app/lib/utils/motion";
import { IconLink } from "./lib/components/IconLink";
const ANIMATE_CLASS = "animate-fadeIn opacity-0";

function WelcomeHero() {
  const { ref, isVisible } = useReveal<HTMLDivElement>({ rootMargin: "120px 0px", threshold: 0.1 });
  return (
    <section
      ref={ref}
      className={`relative bg-cover bg-center bg-no-repeat h-full flex items-center justify-center overflow-hidden ${motionVariants.fadeIn}`}
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
          Open Source · Collaborative · Ethnography
        </div>
        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/lib/pages/signupPage"
            className="px-8 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg shadow-lg transition"
          >
            Get Started
          </a>
          <a
            href="/lib/pages/map"
            className="px-8 py-3 rounded-full bg-white/90 hover:bg-white text-blue-700 font-semibold text-lg shadow-lg transition border border-blue-100"
          >
            Explore the Map
          </a>
        </div>
      </div>
    </section>
  );
}

export default function WelcomePage() {
  return (
    <>
      <WelcomeHero />

      <div className="relative flex flex-col lg:flex-row bg-gradient-to-br from-slate-50 via-white to-blue-50">
        {/* Left Side - Content */}
        <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-16 lg:py-24 h-screen">
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
            <div className={`flex flex-wrap gap-3 mb-8 ${ANIMATE_CLASS}`} style={{ animationDelay: "0.4s" }}>
              {["Global Mapping", "Data Collection", "Open Source"].map((feature, i) => (
                <div
                  key={i}
                  className="cursor-default px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 shadow-sm"
                >
                  {feature}
                </div>
              ))}
            </div>

            {/* CTA and Social Links */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Primary CTA */}
              <a
                className="group relative inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 px-8 py-4 text-base font-bold text-white shadow-2xl shadow-blue-500/50 hover:shadow-blue-500/70 hover:scale-105 transition-all duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/50 overflow-hidden"
                href="https://religioninplace.org/blog/wheres-religion/#:~:text=Where's%20Religion%3F%20is%20conceptualized%20and,and%20cultural%20diversity%20at%20scale."
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative flex items-center gap-2">
                  Learn More
                  <svg
                    className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </a>

              {/* Social links */}
              <div className="flex items-center gap-3">
                <span className="hidden sm:block text-white/40 text-sm">|</span>
                <div className="flex items-center gap-2">
                  <IconLink
                    icon="instagram"
                    href="https://www.instagram.com/livedreligion/"
                    label="Visit Instagram"
                    size="h-6 w-6"
                    className="w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl flex items-center justify-center hover:bg-white/20 hover:scale-[1.03] hover:border-white/40 transition-all duration-300 shadow-md shadow-blue-500/30"
                  />
                  <IconLink
                    icon="twitterX"
                    href="https://twitter.com/livedreligion"
                    label="Visit Twitter/X"
                    size="h-6 w-6"
                    className="w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl flex items-center justify-center hover:bg-white/20 hover:scale-[1.03] hover:border-white/40 transition-all duration-300 shadow-md shadow-blue-500/30 hover:text-black"
                  />
                  <IconLink
                    icon="github"
                    href="https://github.com/oss-slu/lrda_website"
                    label="Visit GitHub"
                    size="h-6 w-6"
                    className="w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl flex items-center justify-center hover:bg-white/20 hover:scale-[1.03] hover:border-white/40 transition-all duration-300 shadow-md shadow-blue-500/30 hover:text-black"
                  />
                </div>
              </div>
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
        <div className="flex-1 flex items-center justify-center h-screen relative py-16 lg:py-0 overflow-hidden">
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
          {/* Wavy divider at the bottom */}
          <div className="absolute left-0 right-0 bottom-0 w-full overflow-hidden pointer-events-none z-20">
            <svg viewBox="0 0 600 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-10" preserveAspectRatio="none">
              <path
                d="M0,20 C150,40 450,0 600,20 L600,40 L0,40 Z"
                fill="#f8fafc" // Tailwind's slate-50
              />
            </svg>
          </div>
        </div>
      </div>
    </>
  );
}
