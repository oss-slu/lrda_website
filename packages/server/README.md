# LRDA Server

This is the backend server for the Where's Religion (LRDA) project. It provides a RESTful API built on the RERUM framework for managing religious data, notes, and user authentication.

## Architecture

The server is built using:

- **Express.js** - Web framework
- **RERUM** - Core data management framework (`lrda-server-core`)
- **MongoDB** - Database for data persistence
- **Firebase Admin** - Authentication middleware
- **Docker** - Containerized MongoDB setup

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Environment Setup

Copy the environment template and configure:

```bash
cp .env.example .env
```

### 3. Start MongoDB

Using Docker (recommended):

```bash
docker-compose up --build -d
```

This starts:

- **MongoDB** on port `27017`
- **Mongo Express** (web UI) on port `8081`

Access Mongo Express at http://localhost:8081 with:

- Username: `mongoexpressuser`
- Password: `mongoexpresspass`

### 4. Run the Server

Development mode (with auto-reload):

```bash
pnpm run dev
```

Production mode:

```bash
pnpm start
```

The server will start on http://localhost:3001

## API Documentation

### Interactive Documentation

Visit http://localhost:3001/reference for interactive API documentation powered by Scalar.

### OpenAPI Specification

The OpenAPI spec is available at http://localhost:3001/openapi.json

## Authentication

The server implements **selective authentication** that protects data-modifying operations while keeping read operations public:

- **✅ Public (no auth required)**: GET requests and read-only operations
- **🔒 Protected (auth required)**: POST, PUT, PATCH, DELETE requests

### Development Mode

Set `DISABLE_AUTH=true` in your `.env` file to completely bypass authentication for local development:

```env
DISABLE_AUTH=true
```

When enabled, you'll see `[Auth] Authentication bypassed (DISABLE_AUTH=true)` in the server logs.

### Production Mode

1. Set `DISABLE_AUTH=false` in your `.env` file
2. Obtain the `firebase-admin.json` service account file from your team lead
3. Place it in this directory (packages/server/)
4. Configure the path in `.env`:

```env
DISABLE_AUTH=false
GOOGLE_APPLICATION_CREDENTIALS=./firebase-admin.json
```

### Protected Routes

The following routes require Firebase authentication when `DISABLE_AUTH=false`:

- `POST /v1/create` - Create new objects
- `POST /v1/bulkCreate` - Bulk create
- `PUT /v1/bulkUpdate` - Bulk update
- `PUT /v1/update` - Update objects
- `PATCH /v1/patch` - Patch update
- `PATCH /v1/set` - Set properties
- `PATCH /v1/unset` - Unset properties
- `DELETE /v1/delete` - Delete objects
- `POST /v1/overwrite` - Overwrite objects
- `POST /v1/release` - Release objects

### Public Routes (Always Accessible)

- `GET /v1/id/:id` - Get object by ID
- `POST /v1/query` - Query objects (GET-like operation)
- `GET /v1/since/:id` - Get version history since
- `GET /v1/history/:id` - Get full version history
- `GET /reference` - API documentation
- `GET /openapi.json` - OpenAPI specification

### Making Authenticated Requests

Include a Firebase ID token in the Authorization header:

```bash
curl http://localhost:3001/v1/create \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -d '{"label": "My Note", "description": "Note content"}'
```

### Testing Authentication

See [TEST_AUTH.md](./TEST_AUTH.md) for comprehensive testing instructions.

### Using Firebase Emulator

For local development without real credentials:

```bash
# Set emulator host
export FIREBASE_AUTH_EMULATOR_HOST=localhost:9099

# Start Firebase emulator
firebase emulators:start --only auth
```

## Database Operations

### Seeding Data

```bash
node seed.js
```

### Downloading/Exporting Notes

```bash
node download-notes.js
```

## Development

### Available Scripts

- `pnpm start` - Start production server
- `pnpm dev` - Start development server with nodemon
- `pnpm test` - Run tests (not yet implemented)

### Environment Variables

| Variable                         | Description                      | Default                                   |
| -------------------------------- | -------------------------------- | ----------------------------------------- |
| `PORT`                           | Server port                      | `3001`                                    |
| `MONGO_CONNECTION_STRING`        | MongoDB connection URL           | `mongodb://root:example@localhost:27017/` |
| `MONGO_DB`                       | Database name                    | `testdb`                                  |
| `MONGO_COLLECTION`               | Collection name                  | `testcollection`                          |
| `DISABLE_AUTH`                   | Disable authentication           | `true`                                    |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to Firebase service account | `./firebase-admin.json`                   |
| `DOWN`                           | Server maintenance mode          | `false`                                   |
| `READONLY`                       | Read-only mode                   | `false`                                   |
| `TRUST_PROXY`                    | Trust proxy headers              | `false`                                   |

## Troubleshooting

### MongoDB Connection Issues

1. Ensure Docker is running: `docker ps`
2. Start MongoDB: `docker-compose up -d mongo`
3. Check connection string in `.env`

### Authentication Errors

**"No token provided" (401)**

- You're trying to modify data (POST/PUT/PATCH/DELETE) without authentication
- For development: Set `DISABLE_AUTH=true` in `.env`
- For production: Include `Authorization: Bearer <token>` header

**"Invalid token" (401)**

- Firebase token is expired (tokens expire after 1 hour)
- Firebase credentials not configured correctly
- Ensure `firebase-admin.json` exists and `GOOGLE_APPLICATION_CREDENTIALS` is set

**Authentication bypass not working**

- Verify `DISABLE_AUTH=true` in `.env` (not `.env.example`)
- Restart server after changing `.env`
- Check for `[Auth] Authentication bypassed` in server logs

### Port Conflicts

1. Change `PORT` in `.env`
2. Update `RERUM_BASE` and `RERUM_PREFIX` accordingly

### Firebase Setup Issues

1. Request `firebase-admin.json` from your team lead
2. Place file in this directory (packages/server/)
3. Verify path in `.env` matches file location
4. Check file contains valid JSON with service account credentials
