/**
 * Shared constants for the map page components.
 */

/** Default notes panel width in pixels (34rem at a 16px root) */
export const DEFAULT_PANEL_WIDTH = 544;

/** Narrowest the notes panel can be dragged -- keeps note cards readable */
export const MIN_PANEL_WIDTH = 320;

/**
 * Narrowest the map can be left when the notes panel is dragged wide. Must fit the
 * top control row: search (80px min + 40px margin, +52px view toggle when logged in)
 * plus zoom/locate (129px) plus the 16px gap to the panel -- 317px worst case.
 */
export const MIN_MAP_VISIBLE_WIDTH = 320;
