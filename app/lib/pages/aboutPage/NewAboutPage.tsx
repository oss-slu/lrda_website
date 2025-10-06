"use client";
import React from "react";
import Image from "next/image";
import { Icons } from "@/app/lib/components/icons";
import { useReveal, motionVariants } from "@/app/lib/utils/motion";
import { IconLink } from "@/app/lib/components/IconLink";

function AboutHero() {
  const { ref, isVisible } = useReveal<HTMLDivElement>({ rootMargin: "120px 0px", threshold: 0.1 });
  return (
    <section
      ref={ref}
      className={`relative bg-cover bg-center bg-no-repeat min-h-[50vh] flex items-center justify-center ${motionVariants.fadeIn}`}
      data-reveal={isVisible}
      style={{ backgroundImage: 'url("/splash.png")' }}
    >
      <div className="absolute inset-0 bg-black/70" />
      <div className="relative text-center text-white p-8 sm:p-12 max-w-3xl">
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-tight">
          Where's Religion?
        </h1>
        <p className="mt-6 text-lg sm:text-xl md:text-2xl font-medium text-white/95 leading-relaxed">
          An open-source platform advancing the study of lived religion.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <a
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-2 text-slate-700 font-medium shadow-sm hover:bg-blue-600 hover:border-blue-600 hover:text-white transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            href="https://religioninplace.org/blog/wheres-religion/#:~:text=Where's%20Religion%3F%20is%20conceptualized%20and,and%20cultural%20diversity%20at%20scale."
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn More
          </a>
          <IconLink icon="instagram" href="https://www.instagram.com/livedreligion/" label="Visit Instagram" />
          <IconLink icon="twitterX" href="https://twitter.com/livedreligion" label="Visit Twitter/X" />
          <IconLink icon="github" href="https://github.com/oss-slu/lrda_website" label="Visit GitHub" />
        </div>
      </div>
    </section>
  );
}

function AboutIntro() {
  const { ref, isVisible } = useReveal<HTMLDivElement>();
  return (
    <section ref={ref} className="w-full bg-gradient-to-b from-slate-50 to-white py-14 sm:py-20" data-reveal={isVisible}>
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-center text-slate-900">About Where's Religion?</h2>
        
        {/* Mission Statement Highlight */}
        <div className={`mt-10 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-600 p-6 sm:p-8 rounded-r-lg ${motionVariants.fadeInUp}`} data-reveal={isVisible}>
          <p className="text-lg sm:text-xl leading-relaxed text-slate-800 italic">
            "Advancing the study of lived religion through rigorous scholarly methods that account for embodied experiences, 
            improvised practices, material cultures, and shared spaces."
          </p>
        </div>

        {/* Main Description */}
        <div className={`mt-12 grid md:grid-cols-2 gap-8 items-start ${motionVariants.fadeInUp}`} data-reveal={isVisible}>
          <div>
            <h3 className="text-2xl font-semibold text-slate-900 mb-4">Our Platform</h3>
            <p className="text-base sm:text-lg leading-7 text-slate-700">
              Where's Religion? is an open-source application developed by humanities faculty and IT professionals at Saint Louis University 
              that supports in-person research, remote data entry, media sharing, and mapping. The app is designed to facilitate a more robust 
              public understanding of religion through rigorous scholarly methods.
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

        {/* Key Features */}
        <div className={`mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6 ${motionVariants.fadeInUp}`} data-reveal={isVisible}>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="text-blue-600 text-3xl mb-3">📍</div>
            <h4 className="font-semibold text-slate-900 mb-2">Mapping</h4>
            <p className="text-sm text-slate-600">Visualize religious practices and spaces geographically</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="text-blue-600 text-3xl mb-3">🔍</div>
            <h4 className="font-semibold text-slate-900 mb-2">Research</h4>
            <p className="text-sm text-slate-600">Support in-person fieldwork and documentation</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="text-blue-600 text-3xl mb-3">📊</div>
            <h4 className="font-semibold text-slate-900 mb-2">Data Entry</h4>
            <p className="text-sm text-slate-600">Remote and collaborative data collection</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="text-blue-600 text-3xl mb-3">📸</div>
            <h4 className="font-semibold text-slate-900 mb-2">Media Sharing</h4>
            <p className="text-sm text-slate-600">Rich multimedia documentation and sharing</p>
          </div>
        </div>

        {/* Funding Stats */}
        <div className={`mt-12 bg-slate-100 rounded-xl p-8 ${motionVariants.fadeInUp}`} data-reveal={isVisible}>
          <h3 className="text-2xl font-semibold text-slate-900 mb-6 text-center">Support & Recognition</h3>
          <div className="grid sm:grid-cols-3 gap-6 mb-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600">$870K</div>
              <div className="text-sm text-slate-600 mt-1">Total Funding</div>
              <div className="text-xs text-slate-500 mt-1">Henry Luce Foundation</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600">2018</div>
              <div className="text-sm text-slate-600 mt-1">Initial Award</div>
              <div className="text-xs text-slate-500 mt-1">$400,000</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600">2022</div>
              <div className="text-sm text-slate-600 mt-1">Follow-up Award</div>
              <div className="text-xs text-slate-500 mt-1">$470,000</div>
            </div>
          </div>
          
          <div className="text-center pt-6 border-t border-slate-300">
            <p className="text-sm text-slate-700 leading-relaxed">
              <span className="font-semibold">Institutional Support:</span> College of Arts & Sciences • Office for the Vice President for Research • 
              Research Computing Group • Open Source with SLU • Walter J. Ong, S.J., Center for Digital Humanities • 
              CREST Research Center (Culture, Religion, Ethics, Science, Technology)
            </p>
          </div>
        </div>

        {/* Center Connection */}
        <div className={`mt-8 text-center ${motionVariants.fadeInUp}`} data-reveal={isVisible}>
          <p className="text-base text-slate-700">
            Where's Religion? is a keystone outcome of the <span className="font-semibold text-slate-900">Center on Lived Religion</span> at Saint Louis University
          </p>
        </div>
      </div>
    </section>
  );
}

const initiativeTeam = [
  { name: "Rachel Lindsey", 
    role: "Director of Center on Lived Religion", 
    src: "/aboutPageImages/Rachel.jpg" },
  { name: "Adam Park", 
    role: "Associate Director of Research (COLR)", 
    src: "/aboutPageImages/Adam.jpg" },
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
  { name: "Patrick Cuba",
    role: "IT Architect", 
    src: "/aboutPageImages/Patrick.jpg" },
  { name: "Bryan Haberberger", 
    role: "Full Stack Developer", 
    src: "/aboutPageImages/Bryan.jpg" },
  // Developers
  { name: "Izak Robles", 
    role: "Developer", 
    src: "/aboutPageImages/Izak.jpg" },
  { name: "Stuart Ray",
    role: "Developer",
    src: "/aboutPageImages/Stuart.jpg" },
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
      <div
        className={`flex flex-wrap gap-8 justify-center ${motionVariants.fadeInUp}`}
        data-reveal={isVisible}
      >
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
    <div className="font-sans leading-6 bg-slate-50">
      <AboutHero />
      <AboutIntro />
      <TeamGrid />
    </div>
  );
};

export default Page;
