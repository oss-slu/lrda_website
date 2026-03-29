# Map

The map page provides a geographic view of all notes, allowing users to browse, filter, and explore research entries anchored to real-world locations.

## Overview

The map is built with the [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript) via `@react-google-maps/api`. Notes are displayed as markers on the map, with clustering for dense areas. Clicking a marker opens the note details.

## Key Features

- **Marker clustering**: Notes in close proximity are grouped into clusters that expand on zoom
- **Location-based filtering**: Filter notes by geographic region
- **Note preview**: Click a marker to see a summary of the note
- **Search integration**: Search bar filters both the map markers and the note list
- **Responsive**: Map adapts to different screen sizes

## Configuration

The map requires two environment variables in `packages/web/.env.local`:

```ini
VITE_MAP_KEY=your-google-maps-api-key
VITE_MAP_ID=your-google-maps-map-id
```

Get both from the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).

## Key Files

| File | Purpose |
| --- | --- |
| `app/lib/components/Map/` | Map component directory |
| `app/lib/hooks/queries/` | Data fetching hooks for map notes |
