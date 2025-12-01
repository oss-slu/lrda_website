"use client";
import React from "react";
import TeamCard from "./team_card";
import ContributorCard from "./contributor_card";
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
    offset: 10,
    src: "/aboutPageImages/Zanxiang.jpg",
    socials: { github: "https://github.com/BaloneyBoy97", linkedin: "https://www.linkedin.com/in/zanxiang-wang-352b112a0/" },
  },
  {
    name: "Jacob Maynard",
    role: "Tech Lead",
    offset: 40,
    src: "https://github.com/InfinityBowman.png",
    socials: { github: "https://github.com/InfinityBowman", linkedin: "https://www.linkedin.com/in/jacob-maynard-283767230/" },
  },
  // Senior Developers
  { name: "Patrick Cuba", role: "IT Architect", src: "/aboutPageImages/Patrick.png", offset: 10 },
  { name: "Bryan Haberberger", role: "Full Stack Developer", src: "/aboutPageImages/Bryan.png" },
  // Developers
  { name: "Izak Robles", role: "Developer", src: "/aboutPageImages/Izak.jpg", offset: 60 },
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
    offset: 70,
    socials: { github: "https://github.com/jwang-101", linkedin: "https://www.linkedin.com/in/justin-wang-2a67b1295/" },
  },
  { name: "Sam Sheppard", role: "Developer", src: "/aboutPageImages/Sam.jpg", offset: 40 },
  {
    name: "Puneet Sontha",
    role: "Developer",
    offset: 30,
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
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-100/30"></div>
      <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-blue-400/30 to-blue-600/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-blue-600/15 to-blue-400/15 rounded-full blur-3xl"></div>

      <div className="relative z-10 py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4">
          {/* Header section */}
          <div ref={headerRef} className={`text-center mb-20 ${motionVariants.fadeInUp}`} data-reveal={headerVisible}>
            <h2 className="text-4xl sm:text-6xl font-bold tracking-tight text-slate-900 mb-6">
              The Saint Louis University
              <span className="bg-gradient-to-r from-blue-700 via-blue-500 to-blue-300 bg-clip-text text-transparent inline-block w-full py-1">
                Where's Religion Team
              </span>
            </h2>
          </div>

          {/* Leadership Section */}
          <div ref={initiativeRef} className={`mb-24 ${motionVariants.fadeInUp}`} data-reveal={initiativeVisible}>
            <div className="text-center mb-12">
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">Leadership</h3>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">Leading the Where's Religion Initiative </p>
            </div>

            <div className="flex flex-wrap gap-8 justify-center max-w-4xl mx-auto">
              {initiativeTeam.map((person, index) => (
                <div key={person.name} className="w-full sm:w-auto">
                  <TeamCard {...person} delay={index * 100} />
                </div>
              ))}
            </div>
          </div>

          {/* Contributors Section */}
          <div ref={devRef} className={`${motionVariants.fadeInUp}`} data-reveal={devVisible}>
            <div className="text-center mb-12">
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">Contributors</h3>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed"> Building the platform</p>
            </div>

            <div className="flex flex-wrap gap-8 justify-evenly">
              {devTeam.map((person, index) => (
                <div key={person.name} className="flex-grow basis-72 max-w-xs">
                  <ContributorCard {...person} delay={index * 50} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
