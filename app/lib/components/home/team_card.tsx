"use client";
import React from "react";
import Image from "next/image";
import { Icons } from "@/app/lib/components/icons";
import { useReveal, motionVariants } from "@/app/lib/utils/motion";

type TeamCardProps = {
  name: string;
  role: string;
  src: string;
  socials?: { github?: string; linkedin?: string };
  delay?: number;
};

export default function TeamCard({ name, role, src, socials, delay = 0 }: TeamCardProps) {
  const { ref, isVisible } = useReveal<HTMLDivElement>({ rootMargin: "120px 0px" });

  return (
    <div
      ref={ref}
      className={`group relative ${motionVariants.scaleIn}`}
      data-reveal={isVisible}
      style={{
        transitionDelay: `${delay}ms`,
      }}
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 blur-xl"></div>

      {/* Main card */}
      <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg shadow-slate-200/50 group-hover:shadow-xl group-hover:shadow-slate-300/50 border border-slate-100 group-hover:border-slate-200 transition-all duration-500">
        {/* Profile image */}
        <div className="relative mx-auto w-24 h-24 mb-6">
          {/* Animated ring */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-[2px] opacity-0 group-hover:opacity-100 transition-all duration-500 rotate-0 group-hover:rotate-180">
            <div className="rounded-full bg-white w-full h-full"></div>
          </div>

          {/* Image container */}
          <div className="relative overflow-hidden rounded-full w-full h-full transition-all duration-300">
            <Image
              src={src}
              alt={name}
              width={96}
              height={96}
              className="object-cover w-full h-full transition-all duration-500 group-hover:scale-110 group-hover:saturate-110"
            />
          </div>
        </div>

        {/* Name and role */}
        <div className="text-center space-y-2">
          <h3 className="font-bold text-lg text-slate-900 group-hover:text-slate-800 transition-colors duration-300">{name}</h3>
          <p className="text-slate-600 text-sm font-medium group-hover:text-slate-700 transition-colors duration-300">{role}</p>
        </div>

        {/* Social links */}
        {socials && (
          <div className="flex justify-center mt-6 space-x-3">
            {socials.github && (
              <a
                href={socials.github}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${name} on GitHub`}
                className="group/social relative inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-900 text-slate-600 hover:text-white transition-all duration-300 hover:scale-110 hover:shadow-lg"
              >
                <Icons.github className="h-4 w-4 transition-transform duration-300 group-hover/social:scale-110" />
              </a>
            )}
            {socials.linkedin && (
              <a
                href={socials.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${name} on LinkedIn`}
                className="group/social relative inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 hover:bg-blue-600 text-slate-600 hover:text-white transition-all duration-300 hover:scale-110 hover:shadow-lg"
              >
                <Icons.linkedin className="h-4 w-4 transition-transform duration-300 group-hover/social:scale-110" />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
