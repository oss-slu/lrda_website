# Notes API

The notes API provides CRUD operations for research notes -- the core data type in the application.

## Endpoints

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/api/notes` | optional | List notes with filtering, search, sorting |
| `GET` | `/api/notes/:id` | optional | Get a single note with media and comments |
| `POST` | `/api/notes` | required | Create a new note |
| `PATCH` | `/api/notes/:id` | required | Update a note |
| `DELETE` | `/api/notes/:id` | required | Delete a note |
| `GET` | `/api/notes/students/:instructorId` | required | Get all notes from an instructor's students |

## Query Parameters (GET /api/notes)

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `published` | boolean | - | Filter by published status |
| `creatorId` | string | - | Filter by creator |
| `search` | string | - | Search in title and text |
| `sort` | enum | `newest` | `newest`, `oldest`, or `alphabetical` |
| `fields` | enum | `full` | `summary` (truncated text, 1 media) or `full` |
| `minLat`, `maxLat`, `minLng`, `maxLng` | number | - | Bounding box filter |
| `approvalRequested` | boolean | - | Filter by approval status |
| `limit` | number | 20 | Results per page (1-200) |
| `offset` | number | 0 | Pagination offset |

## Authorization Rules

- **GET**: Published notes are visible to everyone. Unpublished notes are visible only to the creator.
- **POST**: Requires authentication.
- **PATCH**: Creator, the creator's assigned instructor, or an admin can update.
- **DELETE**: Creator, the creator's assigned instructor, or an admin can delete.
- **Students endpoint**: Only the instructor themselves or an admin can access.

## Note Schema

```json
{
  "id": "string",
  "title": "string | null",
  "text": "string",
  "creatorId": "string",
  "latitude": 38.627,
  "longitude": -90.199,
  "locationName": "St. Louis, MO",
  "isPublished": false,
  "approvalRequested": false,
  "isReturned": false,
  "tags": [{ "name": "fieldwork", "color": "#3b82f6" }],
  "time": "2026-03-28T12:00:00.000Z",
  "createdAt": "2026-03-28T12:00:00.000Z",
  "updatedAt": "2026-03-28T12:00:00.000Z",
  "media": [
    {
      "id": "string",
      "noteId": "string",
      "type": "image",
      "uri": "https://...",
      "thumbnailUri": "https://... | null",
      "uuid": "string | null",
      "createdAt": "ISO8601"
    }
  ],
  "audio": [
    {
      "id": "string",
      "noteId": "string",
      "uri": "https://...",
      "name": "Recording 1",
      "duration": "2:34",
      "uuid": "string | null",
      "createdAt": "ISO8601"
    }
  ]
}
```

## Create Note (POST /api/notes)

```json
{
  "title": "string | null",
  "text": "string (required)",
  "latitude": 38.627,
  "longitude": -90.199,
  "locationName": "string | null",
  "isPublished": false,
  "approvalRequested": false,
  "tags": ["string"],
  "time": "ISO8601 (optional, defaults to now)",
  "media": [
    { "type": "image", "uri": "https://...", "thumbnailUri": null, "uuid": null }
  ],
  "audio": [
    { "uri": "https://...", "name": "Recording 1", "duration": "2:34", "uuid": null }
  ]
}
```

## Reverse Geocoding

When `latitude` and `longitude` are provided (on create or update), the API performs reverse geocoding via Google Maps to auto-populate `locationName`. This requires the `GOOGLE_MAPS_API_KEY` environment variable. If the key is not set or geocoding fails, the provided `locationName` is used as-is.

## Key Files

| File | Purpose |
| --- | --- |
| `packages/api/src/routes/notes.ts` | Route handlers |
| `packages/shared/src/schemas/note.ts` | Zod schema definitions |
| `packages/api/src/db/schema.ts` | Database table definitions (note, media, audio) |
