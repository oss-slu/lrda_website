'use server';

/**
 * @deprecated Feature flags functionality needs to be migrated to the new REST API.
 * These functions currently return defaults/fallbacks.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

/**
 * Adds or updates the About Page feature flag.
 * @deprecated Feature flags need to be implemented in the new API.
 * @param {boolean} enabled - Whether the new About page is enabled.
 * @returns {Promise<Response>} The response from the API.
 */
export async function editAboutPageFlag(enabled: boolean): Promise<Response> {
  console.warn(
    'Feature flags not yet implemented in new API - editAboutPageFlag called with:',
    enabled,
  );
  // Return a mock response for now
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}

/**
 * Fetches the About Page feature flag.
 * @deprecated Feature flags need to be implemented in the new API.
 * @returns {Promise<boolean>} Whether the new About page is enabled.
 */
export async function getAboutPageFlag(): Promise<boolean> {
  console.warn('Feature flags not yet implemented in new API - defaulting to true');
  // Default to true (new about page enabled) since we're migrating away from RERUM
  return true;
}

/**
 * Fetches the About Page feature flag ID.
 * @deprecated Feature flags need to be implemented in the new API.
 * @returns {Promise<string | null>} The ID of the new About page feature flag.
 */
export async function getAboutPageFlagId(): Promise<string | null> {
  console.warn('Feature flags not yet implemented in new API');
  return null;
}
