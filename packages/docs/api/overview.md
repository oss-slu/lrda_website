# API Overview

The Where's Religion? API is a RESTful JSON API built with [Hono](https://hono.dev/) and documented with OpenAPI.

## Base URL

| Environment | URL |
| --- | --- |
| Local development | `http://localhost:3002` |
| Production | Configured via deployment |

## Interactive Documentation

The API serves interactive documentation via [Scalar](https://scalar.com/) at `/reference` when running locally. Start the API server and visit [http://localhost:3002/reference](http://localhost:3002/reference).

## Authentication

Most endpoints require an authenticated session. The API uses session-based auth via httpOnly cookies managed by Better Auth. See [Authentication](/architecture/authentication).

Protected endpoints return `401 Unauthorized` when no valid session cookie is present.

## Request/Response Format

- **Content-Type**: `application/json`
- **Validation**: All request bodies and query parameters are validated with Zod schemas from `@lrda/shared`
- **Errors**: Standard HTTP status codes with JSON error bodies

## Endpoints

| Resource | Base Path | Description |
| --- | --- | --- |
| [Notes](/api/notes) | `/api/notes` | CRUD operations for research notes |
| [Users](/api/users) | `/api/users` | User profiles and management |
| [Comments](/api/comments) | `/api/comments` | Threaded comments on notes |
| Auth | `/api/auth/*` | Authentication (managed by Better Auth) |
| Admin | `/api/admin/*` | Admin-only user and application management |
