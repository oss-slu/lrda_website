"use server";
const RERUM_PREFIX = process.env.NEXT_PUBLIC_RERUM_PREFIX || "";

/**
 * Adds or updates the About Page feature flag in your custom DB.
 * @param {boolean} enabled - Whether the new About page is enabled.
 * @returns {Promise<Response>} The response from the API.
 */
export async function editAboutPageFlag(enabled: boolean): Promise<Response> {
  if (!RERUM_PREFIX) {
    return Promise.reject(new Error("RERUM_PREFIX is not defined in the environment variables."));
  }
  const aboutPageFlagId = await getAboutPageFlagId();
  if (!aboutPageFlagId) return Promise.reject("Feature flag ID is not set. Fetch the flag before editing.");
  return fetch(RERUM_PREFIX + "overwrite", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      "@id": aboutPageFlagId,
      type: "featureFlag",
      id: "newAboutPage",
      enabled,
      description: "Enable the new About page for all users.",
      updatedAt: new Date().toISOString(),
    }),
  });
}

/**
 * Fetches the About Page feature flag
 * @returns {Promise<boolean>} Whether the new About page is enabled.
 */
export async function getAboutPageFlag(): Promise<boolean> {
  if (!RERUM_PREFIX) {
    console.error("RERUM_PREFIX is not defined in the environment variables.");
    return false;
  }
  const response = await fetch(RERUM_PREFIX + "query", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "featureFlag",
      id: "newAboutPage",
    }),
  });
  const data = await response.json();

  return !!(data && data[0] && data[0].enabled);
}

/**
 * Fetches the About Page feature flag ID
 * @returns {Promise<string | null>} The ID of the new About page feature flag.
 */
export async function getAboutPageFlagId(): Promise<string | null> {
  if (!RERUM_PREFIX) {
    console.error("RERUM_PREFIX is not defined in the environment variables.");
    return null;
  }
  const response = await fetch(RERUM_PREFIX + "query", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "featureFlag",
      id: "newAboutPage",
    }),
  });
  const data = await response.json();
  let aboutPageFlagId = data && data[0] && data[0]["@id"] ? data[0]["@id"] : null;

  return aboutPageFlagId;
}
