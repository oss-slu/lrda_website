# Users API

The users API handles user profiles, role management, and instructor-student relationships.

## Endpoints

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/api/users/me` | required | Get the current user's full profile |
| `PATCH` | `/api/users/me` | required | Update own profile |
| `POST` | `/api/users/me/instructor` | required | Assign an instructor to yourself |
| `GET` | `/api/users/instructors` | none | List all instructors (public) |
| `GET` | `/api/users/:id` | none | Get a user's public profile |
| `GET` | `/api/users/:id/students` | required | List students for an instructor |

## User Roles

| Role | Description |
| --- | --- |
| `user` | Default. Can create notes, publish directly or request approval. |
| `admin` | Full access including user management and admin panel. |

Instructor status is a separate boolean (`isInstructor`), not a role. A user can be both an admin and an instructor.

## Current User Profile (GET /users/me)

Returns the authenticated user with instructor details:

```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "image": "string | null",
  "role": "user",
  "isInstructor": false,
  "instructorId": "string | null",
  "pendingInstructorDescription": "string | null",
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601",
  "instructor": {
    "id": "string",
    "name": "string",
    "email": "string"
  }
}
```

## Update Profile (PATCH /users/me)

```json
{
  "name": "string (optional)",
  "image": "string | null (optional)",
  "pendingInstructorDescription": "string | null (optional)"
}
```

The `pendingInstructorDescription` field is how users apply to become instructors. Setting it submits the application; admins review it via the [Admin API](/api/admin).

## Assign Instructor (POST /users/me/instructor)

Students assign an instructor to themselves:

```json
{
  "instructorId": "string (required)"
}
```

Once assigned, the student's notes appear in the instructor's dashboard, and publishing requires instructor approval.

## List Students (GET /users/:id/students)

Returns students assigned to the specified instructor. Only the instructor themselves or an admin can access this endpoint.

## Instructor-Student Relationship

- Students assign an instructor via `POST /users/me/instructor`
- Users apply to become instructors by setting `pendingInstructorDescription` on their profile
- Admins approve/reject applications via `POST /api/admin/approve-instructor/:id`
- Once approved, the user's `isInstructor` flag is set to `true`
- Instructors can view their students' notes via `GET /api/notes/students/:instructorId`

## Key Files

| File | Purpose |
| --- | --- |
| `packages/api/src/routes/users.ts` | Route handlers |
| `packages/shared/src/schemas/user.ts` | Zod schema definitions |
