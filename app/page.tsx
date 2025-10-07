import React from "react";
import WelcomePage from "./WelcomePage";
export const dynamic = "force-dynamic";

import NewAboutPage from "./lib/pages/aboutPage/NewAboutPage";
import { getAboutPageFlag } from "@/app/lib/utils/feature_flags";
import OldWelcomePage from "./OldWelcomePage";

export default async function Page() {
  const isNewAboutPage = await getAboutPageFlag();

  if (!isNewAboutPage) {
    return (
      <>
        <WelcomePage />
        <NewAboutPage />
      </>
    );
  }
  return <OldWelcomePage />;
}
