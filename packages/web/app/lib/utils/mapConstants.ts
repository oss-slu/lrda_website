/**
 * Shared constants for the map page components.
 */

/** Width of the notes panel in rem units */
export const PANEL_WIDTH_REM = 34;

/** CSS value for panel width */
export const PANEL_WIDTH = `${PANEL_WIDTH_REM}rem`;

/** CSS calc value for map width when panel is open */
export const MAP_WIDTH_WITH_PANEL = `calc(100% - ${PANEL_WIDTH})`;
