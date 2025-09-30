import NewAboutPage from "./NewAboutPage";
import OldAboutPage from "./OldAboutPage";
import { getAboutPageFlag } from "@/app/lib/utils/feature_flags";

export default async function Page() {
  const isNewAboutPage = await getAboutPageFlag();

  if (isNewAboutPage) {
    return <NewAboutPage />;
  }
  return <OldAboutPage />;
}
