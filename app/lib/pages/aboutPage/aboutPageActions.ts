"use server";
import { editAboutPageFlag } from "@/app/lib/utils/feature_flags";

export async function setAboutPageFlag(enabled: boolean) {
  await editAboutPageFlag(enabled);
}
