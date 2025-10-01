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
      style={{ backgroundImage: 'url("/aboutPageImages/background.jpg")' }}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative text-center text-white p-6 sm:p-10 max-w-2xl">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Where's Religion?</h1>
        <p className="mt-4 text-base sm:text-lg text-white/90">An open-source platform advancing the study of lived religion.</p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <a
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            href="https://religioninplace.org/blog/wheres-religion/#:~:text=Where's%20Religion%3F%20is%20conceptualized%20and,and%20cultural%20diversity%20at%20scale."
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn More
          </a>
          <IconLink icon="instagram" href="https://www.instagram.com/livedreligion/" label="Visit Instagram" />
          <IconLink icon="twitterX" href="https://twitter.com/livedreligion" label="Visit Twitter/X" />
          <IconLink icon="github" href="https://github.com/livedreligion" label="Visit GitHub" />
          <IconLink icon="linkedin" href="https://www.linkedin.com/company/livedreligion" label="Visit LinkedIn" />
        </div>
      </div>
    </section>
  );
}

function AboutIntro() {
  const { ref, isVisible } = useReveal<HTMLDivElement>();
  return (
    <section ref={ref} className="mx-auto max-w-3xl px-4 py-14 sm:py-20" data-reveal={isVisible}>
      <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">About</h2>
      <div className={`mt-6 text-base sm:text-lg leading-7 text-muted-foreground max-w-prose ${motionVariants.fadeInUp}`} data-reveal={isVisible}>
        <p>
          Where’s Religion? is an open-source application developed by humanities faculty and IT professionals at Saint Louis University that
          supports in-person research, remote data entry, media sharing, and mapping. The app is designed to facilitate a more robust public
          understanding of religion through rigorous scholarly methods. Our conviction is that the study of religion must account for the wide
          range of embodied experiences, improvised practices, material cultures, and shared spaces that humans inhabit. Through a research
          methodology that moves beyond analysis of sacred texts, creeds, and official teachings, Where’s Religion? provides a platform to diversify
          the data we study and to advance the study of religion we all encounter in everyday life.
        </p>
        <p className="mt-6">
          Where’s Religion? is a keystone outcome of the Center on Lived Religion at Saint Louis University. We have received external support from the
          Henry Luce Foundation ($400,000 in 2018 and $470,000 in 2022), and internal support from the College of Arts & Sciences, the Office for the Vice
          President for Research and the Research Computing Group, Open Source with SLU, the Walter J. Ong, S.J., Center for Digital Humanities, and the CREST
          Research Center (Culture, Religion, Ethics, Science, Technology).
        </p>
      </div>
    </section>
  );
}

const initiativeTeam = [
  { name: "Rachel Lindsey", role: "Director of Center on Lived Religion", src: "/aboutPageImages/Rachel.jpg" },
  { name: "Adam Park", role: "Associate Director of Research (COLR)", src: "/aboutPageImages/Adam.jpg" },
];

const devTeam = [
  { name: "Yash Bhatia", role: "Software Engineer and Tech Lead", src: "/aboutPageImages/Yash.jpg", socials: { github: "https://github.com/yashb196", linkedin: "https://www.linkedin.com/in/yashbhatia238/" } },
  { name: "Patrick Cuba", role: "IT Architect", src: "/aboutPageImages/Patrick.jpg" },
  { name: "Bryan Haberberger", role: "Full Stack Developer", src: "/aboutPageImages/Bryan.jpg" },
  { name: "Izak Robles", role: "Developer", src: "/aboutPageImages/Izak.jpg" },
  { name: "Stuart Ray", role: "Developer", src: "/aboutPageImages/Stuart.jpg" },
  { name: "Zanxiang Wang", role: "Tech Lead", src: "/aboutPageImages/Zanxiang.jpg", socials: { github: "https://github.com/BaloneyBoy97", linkedin: "https://www.linkedin.com/in/zanxiang-wang-352b112a0/" } },
  { name: "Amy Chen", role: "Developer", src: "/aboutPageImages/Amy.jpg", socials: { github: "https://github.com/amychen108", linkedin: "https://www.linkedin.com/in/amy-chen-0a1232258/" } },
  { name: "Justin Wang", role: "Developer", src: "/aboutPageImages/Justin.jpg", socials: { github: "https://github.com/jwang-101", linkedin: "https://www.linkedin.com/in/justin-wang-2a67b1295/" } },
  { name: "Sam Sheppard", role: "Developer", src: "/aboutPageImages/Sam.jpg" },
  { name: "Jacob Maynard", role: "Tech Lead", src: "https://github.com/InfinityBowman.png", socials: { github: "https://github.com/InfinityBowman", linkedin: "https://www.linkedin.com/in/jacob-maynard-283767230/" } },
  { name: "Puneet Sontha", role: "Developer", src: "/aboutPageImages/Puneet.jpg", socials: { github: "https://github.com/PunSon", linkedin: "https://www.linkedin.com/in/puneet-sontha/" } },
  { name: "Muhammad Hashir", role: "Developer", src: "/aboutPageImages/hashir.jpg", socials: { github: "https://github.com/mhashir03", linkedin: "https://www.linkedin.com/in/muhammad-hashir03" } },
  { name: "Andres Castellanos", role: "Developer", src: "/aboutPageImages/Andres.jpg", socials: { github: "https://github.com/andycaste2004", linkedin: "https://www.linkedin.com/in/andres-castellanos-carrillo-536a10331/" } },
];

function TeamGrid() {
  const { ref, isVisible } = useReveal<HTMLDivElement>({ rootMargin: "120px 0px" });
  return (
    <section ref={ref} className="mx-auto max-w-5xl px-4 py-14 sm:py-20" data-reveal={isVisible}>
      <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-center">The Saint Louis University Where's Religion Team</h2>
      <div className={`mt-10 grid grid-cols-2 sm:grid-cols-3 gap-8 justify-items-center ${motionVariants.fadeInUp}`} data-reveal={isVisible}>
        {initiativeTeam.map((person) => (
          <TeamCard key={person.name} {...person} />
        ))}
      </div>

      <h3 className="mt-16 text-2xl sm:text-3xl font-semibold tracking-tight text-center">The Development Team</h3>
      <div className={`mt-8 grid grid-cols-2 sm:grid-cols-3 gap-8 justify-items-center ${motionVariants.fadeInUp}`} data-reveal={isVisible}>
        {devTeam.map((person) => (
          <TeamCard key={person.name} {...person} />
        ))}
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
    <div ref={ref} className={`flex flex-col items-center text-center ${motionVariants.scaleIn}`} data-reveal={isVisible}>
      <div className="overflow-hidden rounded-full w-32 h-32">
        <Image src={src} alt={name} width={128} height={128} className="object-cover" />
      </div>
      <p className="mt-4 font-semibold">{name}</p>
      <p className="text-sm text-muted-foreground">{role}</p>
      {socials && (
        <div className="flex mt-2 space-x-3">
          {socials.github && (
            <a href={socials.github} target="_blank" rel="noopener noreferrer" aria-label={`${name} on GitHub`} className="inline-flex items-center justify-center rounded-md border p-1.5 hover:bg-accent">
              <Icons.github className="h-5 w-5" />
            </a>
          )}
          {socials.linkedin && (
            <a href={socials.linkedin} target="_blank" rel="noopener noreferrer" aria-label={`${name} on LinkedIn`} className="inline-flex items-center justify-center rounded-md border p-1.5 hover:bg-accent">
              <Icons.linkedin className="h-5 w-5" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}

const Page = () => {
  return (
    <div className="font-sans leading-6">
      <AboutHero />
      <AboutIntro />
      <TeamGrid />
    </div>
  );
};

export default Page;
