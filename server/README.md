# LRDA Server (API gateway)

This folder contains a small Express-based API gateway that proxies to the `rerum` router and enforces Firebase Authentication on write routes (POST, PUT, DELETE, PATCH). The intention is to keep authentication at the API gateway level without modifying the `rerum` package.

## Getting started

1. Copy `.env.example` to `.env` and edit values. You must provide a Firebase service account JSON either as a single-line string in `FIREBASE_SERVICE_ACCOUNT` or as a path in `FIREBASE_SERVICE_ACCOUNT_PATH`. Alternatively, set `DISABLE_AUTH=true` to bypass auth locally.

2. Install dependencies inside the `server/` folder:

```bash
cd server
npm install
```

3. Run the server:

```bash
# development
npm run dev

# production
npm start
```

## Docker (optional)

```bash
docker build -t lrda-server .
docker run -p 4000:4000 --env-file .env lrda-server
```

## Notes

- The middleware in `auth.js` will bypass authentication if `DISABLE_AUTH` is set to `true`.
- The server mounts the `rerum` router at `/api`. Ensure the `rerum` package is available in the environment where you run this gateway, or adjust the require in `index.js` to point to the router module path.
- **IMPORTANT**: Never commit the Firebase service account key file. It is listed in `.gitignore`. Always use environment variables or `.env` (which is ignored).

## Testing Protected Routes

Once the server is running, test authentication:

### Health check (public)
```bash
curl http://localhost:4000/
```

### Test protected route (requires auth)
```bash
# Without token (expect 401)
curl -X POST http://localhost:4000/__auth_test -H 'Content-Type: application/json'

# With valid Bearer token (replace TOKEN with actual ID token)
curl -X POST http://localhost:4000/__auth_test \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_FIREBASE_ID_TOKEN'
```

### Read endpoint (no auth required)
```bash
curl http://localhost:4000/api/<read-endpoint>
```

### Write endpoint (requires auth)
```bash
# Without token (expect 401)
curl -X POST http://localhost:4000/api/<write-endpoint> \
  -d '{}' -H 'Content-Type: application/json'

# With valid token
curl -X POST http://localhost:4000/api/<write-endpoint> \
  -d '{}' -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_FIREBASE_ID_TOKEN'
```

