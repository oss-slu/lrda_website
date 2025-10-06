"use client";
import { editAboutPageFlag } from "@/app/lib/utils/feature_flags";

export function EnableAboutPageButton() {
  return (
    <button
      onClick={async () => {
        await editAboutPageFlag(true);
      }}
      className="bg-green-600 text-white px-4 py-2 rounded mt-4"
    >
      Enable New About Page
    </button>
  );
}

export function DisableAboutPageButton() {
  return (
    <button
      onClick={async () => {
        await editAboutPageFlag(false);
      }}
      className="bg-green-600 text-white px-4 py-2 rounded mt-4"
    >
      Disable New About Page
    </button>
  );
}
