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
docker-compose up -d mongo
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

### Development Mode

Set `DISABLE_AUTH=true` in your `.env` file to disable authentication for development.

### Production Mode

1. Set `DISABLE_AUTH=false`
2. Configure Firebase Admin SDK:
   - Place your Firebase service account JSON file as `firebase-admin.json`
   - Or set `GOOGLE_APPLICATION_CREDENTIALS` environment variable

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

| Variable                  | Description             | Default                                   |
| ------------------------- | ----------------------- | ----------------------------------------- |
| `PORT`                    | Server port             | `3001`                                    |
| `MONGO_CONNECTION_STRING` | MongoDB connection URL  | `mongodb://root:example@localhost:27017/` |
| `MONGO_DB`                | Database name           | `testdb`                                  |
| `MONGO_COLLECTION`        | Collection name         | `testcollection`                          |
| `DISABLE_AUTH`            | Disable authentication  | `true`                                    |
| `DOWN`                    | Server maintenance mode | `false`                                   |
| `READONLY`                | Read-only mode          | `false`                                   |
| `TRUST_PROXY`             | Trust proxy headers     | `false`                                   |

## Troubleshooting

### MongoDB Connection Issues

1. Ensure Docker is running: `docker ps`
2. Start MongoDB: `docker-compose up -d mongo`
3. Check connection string in `.env`

### Authentication Errors

1. For development, set `DISABLE_AUTH=true`
2. For production, ensure Firebase credentials are configured
3. Check `auth.js` for middleware configuration

### Port Conflicts

1. Change `PORT` in `.env`
2. Update `RERUM_BASE` and `RERUM_PREFIX` accordingly