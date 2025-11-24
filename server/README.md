# LRDA Server (API gateway)

This folder contains a small Express-based API gateway that proxies to the `rerum` router and enforces Firebase Authentication on write routes (POST, PUT, DELETE, PATCH). The intention is to keep authentication at the API gateway level without modifying the `rerum` package.

Getting started
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

Docker (optional):

```bash
docker build -t lrda-server .
docker run -p 4000:4000 --env-file .env lrda-server
```

Notes
- The middleware in `auth.js` will bypass authentication if `DISABLE_AUTH` is set to `true`.
- The server mounts the `rerum` router at `/api`. Ensure the `rerum` package is available in the environment where you run this gateway, or adjust the require in `index.js` to point to the router module path.
