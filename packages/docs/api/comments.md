# Comments API

The comments API provides threaded commenting on notes, used for instructor feedback and collaborative discussion.

## Endpoints

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/api/comments/note/:noteId` | optional | List all comments on a note |
| `GET` | `/api/comments/:id` | optional | Get a single comment |
| `POST` | `/api/comments` | required | Create a comment or reply |
| `PATCH` | `/api/comments/:id` | required | Update a comment |
| `DELETE` | `/api/comments/:id` | required | Delete a comment |
| `POST` | `/api/comments/thread/:threadId/resolve` | required | Resolve a comment thread |

## Comment Schema

```json
{
  "id": "string",
  "noteId": "string",
  "authorId": "string",
  "authorName": "string",
  "text": "string",
  "position": { "from": 10, "to": 45 },
  "threadId": "string | null",
  "parentId": "string | null",
  "isResolved": false,
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

## Threading Model

Comments use a thread-based model for organizing discussions:

- **New top-level comment**: A `threadId` is auto-generated (UUID). Set `parentId` to `null`.
- **Reply to a comment**: Set `parentId` to the comment being replied to. The `threadId` is inherited from the parent.
- **Thread resolution**: `POST /api/comments/thread/:threadId/resolve` marks all comments in the thread as resolved.

## Inline Comments (Position)

The `position` field enables comments anchored to specific text ranges in the note:

```json
{
  "position": {
    "from": 10,
    "to": 45
  }
}
```

`from` and `to` are character offsets in the note's text content. This allows the UI to highlight the relevant text passage when displaying the comment.

Set `position` to `null` for general (non-inline) comments.

## Create Comment (POST /api/comments)

```json
{
  "noteId": "string (required)",
  "text": "string (required)",
  "position": { "from": 10, "to": 45 },
  "threadId": "string | null",
  "parentId": "string | null"
}
```

## Update Comment (PATCH /api/comments/:id)

```json
{
  "text": "string (optional)",
  "isResolved": true
}
```

## Resolve Thread

```
POST /api/comments/thread/:threadId/resolve
```

Marks all comments in the thread as resolved. Only instructors and admins can resolve threads.

**Response** `200`:
```json
{
  "success": true,
  "updatedCount": 3
}
```

## Authorization

- **GET**: Anyone can read comments on notes they can access
- **POST**: Requires authentication
- **PATCH**: Author can update their own comment; instructors and admins can update any
- **DELETE**: Author can delete their own comment; instructors and admins can delete any
- **Resolve**: Instructors and admins only

## Key Files

| File | Purpose |
| --- | --- |
| `packages/api/src/routes/comments.ts` | Route handlers |
| `packages/shared/src/schemas/comment.ts` | Zod schema definitions |
