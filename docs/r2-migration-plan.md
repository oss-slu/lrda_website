# Migrate Media Uploads from S3 Proxy to Cloudflare R2

## Context

Media uploads currently go to an external RERUM S3 proxy (`s3-proxy.rerum.io/S3/uploadFile`) -- an unauthenticated third-party service that stores files on AWS S3. This creates a dependency on RERUM infrastructure and has no upload auth (anyone with the URL can upload). Migrating to Cloudflare R2 removes the RERUM dependency, adds auth, and keeps media on infrastructure we control.

**Decisions:**

- Upload endpoint on the existing Node.js API (Lightsail) using `@aws-sdk/client-s3` with R2's S3-compatible API
- R2 custom domain (`media.wheresreligion.org`) for serving
- Lazy migration -- old S3 URLs stay, only new uploads go to R2
- Uploads require authentication

## Plan

### 1. R2 Bucket Setup (manual, before code changes)

1. Create R2 bucket `lrda-media` in Cloudflare dashboard (or `wrangler r2 bucket create lrda-media`)
2. Configure custom domain `media.wheresreligion.org` under bucket Settings > Custom Domains
3. Create R2 API token: R2 > Manage R2 API Tokens > Create API Token with Object Read/Write scoped to `lrda-media`
4. Note the Access Key ID, Secret Access Key, and account ID

Optionally add Terraform resources to `infrastructure/cloudflare.tf`:

```hcl
resource "cloudflare_r2_bucket" "media" {
  account_id = var.cloudflare_account_id
  name       = "lrda-media"
  location   = "ENAM"
}
```

### 2. API: Dependencies and Environment

**Install**: `pnpm --filter @lrda/api add @aws-sdk/client-s3`

**Modify `packages/api/src/env.ts`** -- add to `EnvSchema`:

```
R2_ENDPOINT          -- https://<account_id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID     -- R2 API token access key
R2_SECRET_ACCESS_KEY -- R2 API token secret key
R2_BUCKET_NAME       -- lrda-media
R2_PUBLIC_URL        -- https://media.wheresreligion.org
```

All `z.string()` required.

**Modify `packages/api/.env.example`** -- add the five R2 vars with descriptions.

### 3. API: R2 Client Helper

**Create `packages/api/src/lib/r2.ts`:**

- Singleton `S3Client` configured with R2 endpoint, region `auto`, and R2 credentials
- Export `uploadToR2(key, body, contentType)` -- sends `PutObjectCommand`, returns public URL (`${R2_PUBLIC_URL}/${key}`)
- Key format: `uploads/<year>/<month>/<uuid>.<ext>` (collision-free, date-partitioned)

### 4. API: Upload Route

**Create `packages/api/src/routes/media.ts`:**

`POST /upload` (mounted at `/api/media/upload`):

- Middleware: `requireAuth`
- Body limit: 50MB via Hono's `bodyLimit` middleware
- Parse multipart: `c.req.parseBody()`, extract `file` field
- Validate MIME type against allowlist:

| Category | Max Size | Types                                                |
| -------- | -------- | ---------------------------------------------------- |
| Image    | 10 MB    | `image/jpeg`, `image/png`, `image/gif`, `image/webp` |
| Video    | 50 MB    | `video/mp4`, `video/quicktime`, `video/webm`         |
| Audio    | 25 MB    | `audio/mpeg`, `audio/wav`, `audio/ogg`               |

- Generate key: `uploads/${year}/${month}/${crypto.randomUUID()}.${ext}`
- Read file into ArrayBuffer, upload via `uploadToR2()`
- Return `{ url: string }` with status `201`
- Errors: `400` (bad file), `401` (unauth), `413` (too large)

Note: `@hono/zod-openapi` doesn't handle multipart request schemas well. Define the route with response schemas only, and document the multipart body in the route description. Validate manually in the handler.

**Modify `packages/api/src/routes/index.ts`** -- add `.route('/media', mediaRoutes)`

### 5. Frontend: Update Upload Utility

**Rewrite `packages/web/app/lib/utils/s3_proxy.ts`:**

- Change URL from `S3_PROXY_PREFIX + 'uploadFile'` to `API_URL + '/api/media/upload'`
- Add `credentials: 'include'` for session cookies
- Do NOT set `Content-Type` (browser sets multipart boundary automatically -- can't use `fetchWithAuth` which defaults to `application/json`)
- Parse JSON response `{ url }` instead of `Location` header
- Keep same function signatures: `uploadMedia(file, mediaType): Promise<string>` and `uploadAudio(file): Promise<string>`

**No changes needed in consumers** -- `editor_menu_controls.tsx` and `AudioPicker.tsx` import `uploadMedia`/`uploadAudio` which keep the same signatures and return type (URL string).

**Modify `packages/web/.env.example`** -- remove `VITE_S3_PROXY_PREFIX` (no longer needed; uploads go through `VITE_API_URL`)

## Files Changed

| File                                     | Action                                      |
| ---------------------------------------- | ------------------------------------------- |
| `packages/api/package.json`              | Modify (add `@aws-sdk/client-s3`)           |
| `packages/api/src/env.ts`                | Modify (add 5 R2 env vars)                  |
| `packages/api/.env.example`              | Modify (add R2 vars)                        |
| `packages/api/src/lib/r2.ts`             | Create (S3 client + upload helper)          |
| `packages/api/src/routes/media.ts`       | Create (upload route)                       |
| `packages/api/src/routes/index.ts`       | Modify (register media route)               |
| `packages/web/app/lib/utils/s3_proxy.ts` | Rewrite (point to API)                      |
| `packages/web/.env.example`              | Modify (remove S3 proxy var)                |
| `infrastructure/cloudflare.tf`           | Modify (optional -- add R2 bucket resource) |

## Build Order

1. R2 bucket + custom domain + API token (manual/dashboard)
2. Install `@aws-sdk/client-s3`
3. API env vars (`env.ts` + `.env.example`)
4. R2 client helper (`lib/r2.ts`)
5. Upload route (`routes/media.ts` + register in `index.ts`)
6. Frontend upload utility rewrite (`s3_proxy.ts`)
7. Clean up env examples

## Verification

1. Create R2 bucket and set env vars in API `.env`
2. `pnpm dev` -- start API + web
3. Log in, create/edit a note, upload an image -- verify URL is `https://media.wheresreligion.org/uploads/...`
4. Upload video and audio -- verify all media types work
5. View an old note with existing S3 media -- verify old URLs still render
6. Log out and attempt upload -- verify 401 response
7. Upload a file exceeding size limit -- verify 413 response

## Future: Media Performance Improvements

The R2 migration is primarily an infrastructure improvement (removing RERUM dependency, adding auth). The following are additional optimizations that build on R2 to improve actual load times and user experience.

### Image Resizing / Optimization (highest impact)

Currently a 5MB phone photo gets served at full resolution everywhere -- map popups, note card thumbnails, the detail modal. Serving a 200px thumbnail on the map instead of a 4000px original is a massive difference.

**Option A: Cloudflare Image Transformations** (recommended)

- Append `/cdn-cgi/image/width=300,quality=80` to R2 URLs at render time
- No extra infrastructure, works with R2 custom domain
- ~$0.50/1000 unique transformations, cached after first request
- Frontend helper: `getMediaUrl(uri, { width: 300, quality: 80 })` that appends transform params for R2 URLs and passes through old S3 URLs unchanged

**Option B: Generate thumbnails on upload**

- Resize server-side during upload using `sharp` or `libvips`
- Store both original + thumbnail in R2 (e.g., `uploads/.../uuid.jpg` and `uploads/.../uuid_thumb.jpg`)
- More storage but zero per-request cost
- Requires adding a `thumbnailUri` field to the media response (already exists in the schema but unused for images)

### CDN Caching

Old S3 URLs (`livedreligion.s3.amazonaws.com`) bypass Cloudflare entirely. R2 with a custom domain gets automatic Cloudflare CDN caching globally. This alone speeds up repeat loads significantly. No additional work needed beyond the R2 migration.

### Lazy Loading

`media_viewer.tsx` carousel and map popup images load eagerly. Adding `loading="lazy"` on off-screen images is free and immediate. The map note cards in `MapNotesPanel` would also benefit from lazy-loaded thumbnails.

### Summary Mode + Resized Thumbnails

The `fields=summary` mode already returns only the first media item per note for the map view. Pairing this with resized thumbnails (via Image Transformations or pre-generated) would make the map panel load dramatically faster -- small thumbnail URLs instead of full-res image URLs.

### Client-Side Compression

Compress images before upload using a library like `browser-image-compression` to reduce upload time and storage. The current JPEG conversion in `editor_menu_controls.tsx` could be extended with quality/size limits.

### Video (low priority)

Cloudflare Stream provides adaptive bitrate streaming. Only worth considering if video becomes a major use case. Current approach (serving raw mp4 from R2) is fine for occasional video uploads.
