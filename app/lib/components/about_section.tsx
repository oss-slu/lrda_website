"use client";
import React from "react";
import Image from "next/image";
import { Icons } from "@/app/lib/components/icons";
import { useReveal, motionVariants } from "@/app/lib/utils/motion";

function AboutIntro() {
  const { ref, isVisible } = useReveal<HTMLDivElement>();
  return (
    <section id="aboutSection" ref={ref} className="w-full py-14 sm:py-20" data-reveal={isVisible}>
      <div className="text-center mb-16 z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-full mb-6">
          <span className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-blue-600">
            ABOUT THE PLATFORM
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4">
        {/* Mission Statement Highlight */}
        <div
          className={`bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-600 p-6 sm:p-8 rounded-r-lg ${motionVariants.fadeInUp}`}
          data-reveal={isVisible}
        >
          <p className="text-lg sm:text-xl leading-relaxed text-slate-800 italic">
            "Advancing the study of lived religion through rigorous scholarly methods that account for embodied experiences, improvised
            practices, material cultures, and shared spaces."
          </p>
        </div>

        {/* Main Description */}
        <div className={`mt-12 grid md:grid-cols-2 gap-8 items-start ${motionVariants.fadeInUp}`} data-reveal={isVisible}>
          <div>
            <h3 className="text-2xl font-semibold text-slate-900 mb-4">Our Platform</h3>
            <p className="text-base sm:text-lg leading-7 text-slate-700">
              Where's Religion? is an open-source application developed by humanities faculty and IT professionals at Saint Louis University
              that supports in-person research, remote data entry, media sharing, and mapping. The app is designed to facilitate a more
              robust public understanding of religion through rigorous scholarly methods.
            </p>
          </div>

          <div>
            <h3 className="text-2xl font-semibold text-slate-900 mb-4">Our Approach</h3>
            <p className="text-base sm:text-lg leading-7 text-slate-700">
              Through a research methodology that moves beyond analysis of sacred texts, creeds, and official teachings, Where's Religion?
              provides a platform to diversify the data we study and to advance the study of religion we all encounter in everyday life.
            </p>
          </div>
        </div>

        {/* Funding Stats */}
        <div className={`mt-20 relative ${motionVariants.fadeInUp}`} data-reveal={isVisible}>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-3xl blur-2xl opacity-30" />
          <div className="relative bg-gradient-to-br from-white via-slate-50 to-blue-50 rounded-3xl p-10 sm:p-12 shadow-md border border-slate-200">
            <div className="text-center mb-10">
              <h3 className="text-3xl sm:text-4xl font-black text-slate-900 mb-2">Support & Recognition</h3>
              <p className="text-slate-600">Funded by the Henry Luce Foundation</p>
            </div>

            <div className="grid sm:grid-cols-3 gap-8 mb-10">
              <div className="text-center group">
                <div className="inline-block p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl border border-slate-100 backdrop-blur-sm mb-4 group-hover:scale-[1.01] transition-transform duration-300">
                  <div className="text-5xl sm:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500">
                    $870K
                  </div>
                </div>
                <div className="text-sm font-semibold text-slate-900 mb-1">Total Funding</div>
                <div className="text-xs text-slate-500">Henry Luce Foundation</div>
              </div>

              <div className="text-center group">
                <div className="inline-block p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl border border-slate-100 backdrop-blur-sm mb-4 group-hover:scale-[1.01] transition-transform duration-300">
                  <div className="text-5xl sm:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-500">
                    2018
                  </div>
                </div>
                <div className="text-sm font-semibold text-slate-900 mb-1">Initial Award</div>
                <div className="text-xs text-slate-500">$400,000</div>
              </div>

              <div className="text-center group">
                <div className="inline-block p-6 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 rounded-2xl border border-slate-100 backdrop-blur-sm mb-4 group-hover:scale-[1.01] transition-transform duration-300">
                  <div className="text-5xl sm:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-500">
                    2022
                  </div>
                </div>
                <div className="text-sm font-semibold text-slate-900 mb-1">Follow-up Award</div>
                <div className="text-xs text-slate-500">$470,000</div>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-200">
              <p className="text-sm text-slate-700 leading-relaxed text-center max-w-4xl mx-auto">
                <span className="font-bold text-slate-900">Institutional Support:</span> College of Arts & Sciences · Office for the Vice
                President for Research · Research Computing Group · Open Source with SLU · Walter J. Ong, S.J., Center for Digital
                Humanities · CREST Research Center
              </p>
            </div>
          </div>
        </div>

        {/* Center Connection */}
        <div className={`mt-16 text-center ${motionVariants.fadeInUp}`} data-reveal={isVisible}>
          <div className="inline-block bg-gradient-to-r from-blue-50 via-slate-50 to-blue-100/50 border-2 border-blue-200 rounded-2xl px-8 py-6 shadow-md">
            <p className="text-lg sm:text-xl text-slate-700">
              A keystone outcome of the{" "}
              <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700">
                <a href="https://www.slu.edu/arts-and-sciences/center-on-lived-religion/index.php" target="_blank" rel="noopener noreferrer">Center on Lived Religion</a>
              </span>{" "}
              at Saint Louis University
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

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

function TeamGrid() {
  const { ref, isVisible } = useReveal<HTMLDivElement>({ rootMargin: "120px 0px" });

  // Calculate how many items in the last row (for 3-column grid on desktop)
  const remainderDesktop = devTeam.length % 3;
  const lastRowCountDesktop = remainderDesktop === 0 ? 3 : remainderDesktop;

  // Split team into full rows and last row
  const fullRowsCount = lastRowCountDesktop === 3 ? devTeam.length : devTeam.length - lastRowCountDesktop;
  const fullRows = devTeam.slice(0, fullRowsCount);
  const lastRow = devTeam.slice(fullRowsCount);

  return (
    <section ref={ref} className="w-full bg-gradient-to-b from-white to-slate-50 py-14 sm:py-20" data-reveal={isVisible}>
      <div className="mx-auto max-w-5xl px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">The Saint Louis University Where's Religion Team</h2>
          <p className="mt-2 text-slate-600">Leading the Where's Religion Initiative</p>
        </div>
        <div className={`flex flex-wrap gap-8 justify-center ${motionVariants.fadeInUp}`} data-reveal={isVisible}>
          {initiativeTeam.map((person) => (
            <TeamCard key={person.name} {...person} />
          ))}
        </div>

        <div className="mt-20 text-center mb-12">
          <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">The Development Team</h3>
          <p className="mt-2 text-slate-600">Building the platform</p>
        </div>
        <div className={`${motionVariants.fadeInUp}`} data-reveal={isVisible}>
          {/* Full rows in grid */}
          {fullRows.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 justify-items-center">
              {fullRows.map((person) => (
                <TeamCard key={person.name} {...person} />
              ))}
            </div>
          )}

          {/* Last incomplete row centered */}
          {lastRow.length > 0 && lastRow.length < 3 && (
            <div className="flex flex-wrap gap-8 justify-center mt-8">
              {lastRow.map((person) => (
                <TeamCard key={person.name} {...person} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

type TeamCardProps = {
  name: string;
  role: string;
  src: string;
  socials?: { github?: string; linkedin?: string };
};

function TeamCard({ name, role, src, socials }: TeamCardProps) {
  const { ref, isVisible } = useReveal<HTMLDivElement>({ rootMargin: "120px 0px" });
  return (
    <div ref={ref} className={`flex flex-col items-center text-center group ${motionVariants.scaleIn}`} data-reveal={isVisible}>
      <div className="overflow-hidden rounded-full w-32 h-32 ring-2 ring-transparent group-hover:ring-blue-400 transition-all duration-300">
        <Image
          src={src}
          alt={name}
          width={128}
          height={128}
          className="object-cover transition-transform duration-300 group-hover:scale-110"
        />
      </div>
      <p className="mt-4 font-semibold text-slate-900">{name}</p>
      <p className="text-sm text-slate-600">{role}</p>
      {socials && (
        <div className="flex mt-3 space-x-2">
          {socials.github && (
            <a
              href={socials.github}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${name} on GitHub`}
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 p-2 hover:bg-slate-900 hover:border-slate-900 text-slate-700 hover:text-white transition-all duration-200"
            >
              <Icons.github className="h-4 w-4" />
            </a>
          )}
          {socials.linkedin && (
            <a
              href={socials.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${name} on LinkedIn`}
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 p-2 hover:bg-blue-600 hover:border-blue-600 text-slate-700 hover:text-white transition-all duration-200"
            >
              <Icons.linkedin className="h-4 w-4" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}

const Page = () => {
  return (
    <div className="font-sans leading-6 bg-gradient-to-b from-slate-50 via-white to-blue-50 p-8 sm:p-4">
      <AboutIntro />
      <TeamGrid />
    </div>
  );
};

export default Page;
