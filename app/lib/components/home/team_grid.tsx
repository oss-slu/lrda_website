"use client";
import React from "react";
import TeamCard from "./team_card";
import { useReveal, motionVariants } from "@/app/lib/utils/motion";

const initiativeTeam = [
  { name: "Rachel Lindsey", role: "Director of Center on Lived Religion", src: "/aboutPageImages/Rachel.jpg" },
  { name: "Adam Park", role: "Associate Director of Research (COLR)", src: "/aboutPageImages/Adam.jpg" },
];

const devTeam = [
  // Tech Leads
  {
    name: "Yash Bhatia",
    role: "Software Engineer and Tech Lead",
    src: "/aboutPageImages/Yash.jpg",
    socials: { github: "https://github.com/yashb196", linkedin: "https://www.linkedin.com/in/yashbhatia238/" },
  },
  {
    name: "Zanxiang Wang",
    role: "Tech Lead",
    src: "/aboutPageImages/Zanxiang.jpg",
    socials: { github: "https://github.com/BaloneyBoy97", linkedin: "https://www.linkedin.com/in/zanxiang-wang-352b112a0/" },
  },
  {
    name: "Jacob Maynard",
    role: "Tech Lead",
    src: "https://github.com/InfinityBowman.png",
    socials: { github: "https://github.com/InfinityBowman", linkedin: "https://www.linkedin.com/in/jacob-maynard-283767230/" },
  },
  // Senior Developers
  { name: "Patrick Cuba", role: "IT Architect", src: "/aboutPageImages/Patrick.jpg" },
  { name: "Bryan Haberberger", role: "Full Stack Developer", src: "/aboutPageImages/Bryan.jpg" },
  // Developers
  { name: "Izak Robles", role: "Developer", src: "/aboutPageImages/Izak.jpg" },
  { name: "Stuart Ray", role: "Developer", src: "/aboutPageImages/Stuart.jpg" },
  {
    name: "Amy Chen",
    role: "Developer",
    src: "/aboutPageImages/Amy.jpg",
    socials: { github: "https://github.com/amychen108", linkedin: "https://www.linkedin.com/in/amy-chen-0a1232258/" },
  },
  {
    name: "Justin Wang",
    role: "Developer",
    src: "/aboutPageImages/Justin.jpg",
    socials: { github: "https://github.com/jwang-101", linkedin: "https://www.linkedin.com/in/justin-wang-2a67b1295/" },
  },
  { name: "Sam Sheppard", role: "Developer", src: "/aboutPageImages/Sam.jpg" },
  {
    name: "Puneet Sontha",
    role: "Developer",
    src: "/aboutPageImages/Puneet.jpg",
    socials: { github: "https://github.com/PunSon", linkedin: "https://www.linkedin.com/in/puneet-sontha/" },
  },
  {
    name: "Muhammad Hashir",
    role: "Developer",
    src: "/aboutPageImages/hashir.jpg",
    socials: { github: "https://github.com/mhashir03", linkedin: "https://www.linkedin.com/in/muhammad-hashir03" },
  },
  {
    name: "Andres Castellanos",
    role: "Developer",
    src: "/aboutPageImages/Andres.jpg",
    socials: { github: "https://github.com/andycaste2004", linkedin: "https://www.linkedin.com/in/andres-castellanos-carrillo-536a10331/" },
  },
];

export default function TeamGrid() {
  const { ref: headerRef, isVisible: headerVisible } = useReveal<HTMLDivElement>({ rootMargin: "120px 0px" });
  const { ref: initiativeRef, isVisible: initiativeVisible } = useReveal<HTMLDivElement>({ rootMargin: "80px 0px" });
  const { ref: devRef, isVisible: devVisible } = useReveal<HTMLDivElement>({ rootMargin: "80px 0px" });

  return (
    <section className="w-full relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50/30"></div>
      <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-purple-400/15 to-pink-400/15 rounded-full blur-3xl"></div>

      <div className="relative z-10 py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4">
          {/* Header section */}
          <div ref={headerRef} className={`text-center mb-20 ${motionVariants.fadeInUp}`} data-reveal={headerVisible}>
            <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-full text-blue-700 text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
              Meet Our Team
            </div>
            <h2 className="text-4xl sm:text-6xl font-bold tracking-tight text-slate-900 mb-6">
              The Saint Louis University
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent block">
                Where's Religion Team
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Leading the Where's Religion Initiative with cutting-edge technology and innovative research
            </p>
          </div>

          {/* Initiative Team Section */}
          <div ref={initiativeRef} className={`mb-24 ${motionVariants.fadeInUp}`} data-reveal={initiativeVisible}>
            <div className="text-center mb-12">
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">Leadership</h3>
              <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
            </div>

            <div className="flex flex-wrap gap-8 justify-center max-w-4xl mx-auto">
              {initiativeTeam.map((person, index) => (
                <div key={person.name} className="w-full sm:w-auto">
                  <TeamCard {...person} delay={index * 100} />
                </div>
              ))}
            </div>
          </div>

          {/* Development Team Section */}
          <div ref={devRef} className={`${motionVariants.fadeInUp}`} data-reveal={devVisible}>
            <div className="text-center mb-16">
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">Development Team</h3>
              <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full"></div>
              <p className="mt-6 text-slate-600 text-lg">Building the future of religious research</p>
            </div>

            {/* Modern masonry-style grid */}
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-8 space-y-8">
              {devTeam.map((person, index) => (
                <div key={person.name} className="break-inside-avoid">
                  <TeamCard {...person} delay={index * 50} />
                </div>
              ))}
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="text-center mt-24">
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <span className="mr-2">🚀</span>
              Want to join our mission?
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
