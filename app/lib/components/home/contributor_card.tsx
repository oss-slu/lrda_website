"use client";
import React from "react";
import Image from "next/image";
import { Icons } from "@/app/lib/components/icons";
import { useReveal, motionVariants } from "@/app/lib/utils/motion";

type ContributorCardProps = {
  name: string;
  role: string;
  src: string;
  socials?: { github?: string; linkedin?: string };
  delay?: number;
};

export default function ContributorCard({ name, role, src, socials, delay = 0 }: ContributorCardProps) {
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
      {/* Card */}
      <div className="relative h-64 bg-slate-900 rounded-3xl overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <Image src={src} alt={name} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />

          {/* Dark overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20"></div>
        </div>

        {/* Content overlay */}
        <div className="absolute inset-0 flex flex-col justify-end p-5 z-10">
          {/* Decorative line */}
          <div className="w-8 h-0.5 bg-blue-600 mb-2"></div>

          {/* Role tag */}
          <div className="inline-block mb-2 self-start">
            <span className="text-[10px] font-bold tracking-wider uppercase text-white/90 bg-white/10 backdrop-blur-sm px-2 py-0.5 rounded border border-white/20">
              {role}
            </span>
          </div>

          {/* Name */}
          <h3 className="font-bold text-xl text-white tracking-tight">{name}</h3>

          {/* Social links bottom right */}
          {socials && (
            <div className="absolute bottom-5 right-5 flex gap-2">
              {socials.github && (
                <a
                  href={socials.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${name} on GitHub`}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white hover:text-slate-900 text-white border border-white/20 transition-all duration-200"
                >
                  <Icons.github className="h-3.5 w-3.5" />
                </a>
              )}
              {socials.linkedin && (
                <a
                  href={socials.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${name} on LinkedIn`}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-blue-600 text-white border border-white/20 transition-all duration-200"
                >
                  <Icons.linkedin className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
