import React from "react";
import AboutIntro from "./about_intro";
import TeamGrid from "./team_grid";

export default function Page() {
  return (
    <div className="font-sans leading-6 bg-gradient-to-b from-slate-50 via-white to-blue-50 p-8 sm:p-4">
      <AboutIntro />
      <TeamGrid />
    </div>
  );
}
