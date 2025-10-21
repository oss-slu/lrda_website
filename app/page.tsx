import React from "react";
import WelcomePage from "./WelcomePage";
import AboutPage from "./lib/components/about_section";

export default async function Page() {
  return (
    <>
      <WelcomePage />
      <AboutPage />
    </>
  );
}
