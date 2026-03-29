# Admin API

Admin endpoints for user management, instructor approvals, and platform statistics. All endpoints require authentication with an `admin` role.

## Authorization

Every admin endpoint requires both:
1. **`requireAuth`** -- valid session cookie
2. **`requireAdmin`** -- `user.role === 'admin'`

Non-admin users receive `403 Forbidden`.

## Endpoints

### List All Users

```
GET /api/admin/users
```

Returns all users with admin-visible fields (role, ban status, instructor applications).

**Response** `200`:
```json
[
  {
    "id": "string",
    "name": "string",
    "email": "string",
    "image": "string | null",
    "role": "user | admin",
    "isInstructor": true,
    "banned": false,
    "banReason": "string | null",
    "banExpires": "ISO8601 | null",
    "pendingInstructorDescription": "string | null",
    "createdAt": "ISO8601"
  }
]
```

### Pending Instructor Applications

```
GET /api/admin/pending-instructors
```

Returns users who have submitted an instructor application (non-null `pendingInstructorDescription`).

**Response** `200`:
```json
[
  {
    "id": "string",
    "name": "string",
    "email": "string",
    "description": "string",
    "createdAt": "ISO8601"
  }
]
```

### Approve Instructor

```
POST /api/admin/approve-instructor/{id}
```

Sets `isInstructor = true` and clears the pending application.

**Response** `200`:
```json
{
  "success": true,
  "message": "Instructor approved successfully"
}
```

### Reject Instructor

```
POST /api/admin/reject-instructor/{id}
```

Clears the pending application without granting instructor status.

**Response** `200`:
```json
{
  "success": true,
  "message": "Instructor application rejected"
}
```

### User Statistics

```
GET /api/admin/stats
```

**Response** `200`:
```json
{
  "totalUsers": 142,
  "totalAdmins": 3,
  "totalInstructors": 12,
  "pendingApplications": 2
}
```

### Content Statistics

```
GET /api/admin/content-stats
```

**Response** `200`:
```json
{
  "totalNotes": 847,
  "publishedNotes": 523,
  "notesThisWeek": 34,
  "notesThisMonth": 156
}
```

### Recent Activity

```
GET /api/admin/recent-activity
```

Returns the 20 most recently updated notes.

**Response** `200`:
```json
[
  {
    "noteId": "string",
    "title": "string | null",
    "creatorName": "string",
    "createdAt": "ISO8601",
    "updatedAt": "ISO8601",
    "isPublished": true
  }
]
```

## Key Files

| File | Purpose |
| --- | --- |
| `packages/api/src/routes/admin.ts` | Route handlers |
| `packages/api/src/middleware/auth.ts` | `requireAdmin` middleware |
| `packages/shared/src/schemas/admin.ts` | Zod schema definitions |
