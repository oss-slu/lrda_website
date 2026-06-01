# Media Storage on S3 + Thumbnails (Design)

Status: **Design fully settled — ready to build.** Approach: **AWS S3 (`lrda-media-production`)
+ presigned direct upload + S3-event Lambda thumbnails + full migration off RERUM, all
codified in `infrastructure/`.**

## Background / Problem

A DevTools trace of the note detail + map sidebar showed the real bottleneck is **image
decoding**, not JS:

- Source images are full-resolution originals (**2848x2848, ~8 MP**) served straight from
  RERUM's S3 proxy (`livedreligion.s3.amazonaws.com`), but displayed at 240-256 px.
- **264 image decodes ≈ 5.6 s** (plus ~5.6 s LazyPixelRef, ~4.7 s raster). Each image is
  decoded 4-16x because the decoded 8 MP bitmaps blow the cache and get re-decoded on every
  repaint.

Two problems to fix together:

1. **Infra**: uploads depend on RERUM's unauthenticated third-party proxy. We want our own
   authenticated storage (advances the documented RERUM migration).
2. **Performance**: we need small, pre-generated thumbnails for list/card/hero/attachment
   views, keeping the full original only for the lightbox.

## Goals

- Own the storage (AWS S3, our bucket, authenticated uploads).
- Generate a thumbnail per image so list/grid/hero views load small assets.
- Upload **directly from client to S3** (server does not proxy file bytes).
- **Fully migrate** all existing media off RERUM into our bucket (not lazy).
- Cheap to run and operate (lifecycle tiering + CDN caching).

## Decisions (settled)

- **Storage:** AWS S3, bucket we own (already on AWS via Lightsail; one vendor, IAM roles,
  all media in one place).
- **Upload:** **presigned direct-to-S3** from the browser. Server only mints the presigned
  request; it never receives the file bytes.
- **Presigned POST (not PUT):** so S3 itself enforces **size** (`content-length-range`) and
  **content-type** conditions inline during the upload (see enforcement note below).
- **Thumbnail generation:** **S3 `ObjectCreated` event -> Lambda (sharp)** (Option A below).
- **Resizing tech:** `sharp` (libvips) for thumbnail generation.
- **Thumbnail target:** ~**1024 px max edge, WebP, quality ~80**. Covers card (256), hero
  (~512), and attachment (80) at 2x DPR; lightbox uses the full original.
- **Migration:** **full** — copy every existing media object into our bucket and rewrite the
  DB URLs (not lazy / not leave-old-URLs).
- **Lifecycle:** originals → **S3 Intelligent-Tiering** (instant retrieval; NOT Glacier/Deep
  Archive, which would break on-demand lightbox loads). Thumbnails → **Standard** (served
  constantly).
- **CDN:** **CloudFront** in front of the bucket. `S3_PUBLIC_BASE_URL` points at the
  distribution domain so the cache layer is swappable without code changes.
- **Auth:** presign endpoint requires a session (`requireAuth`), matching note write routes.
- **Env var names:** `MEDIA_S3_BUCKET`, `AWS_REGION`, `S3_PUBLIC_BASE_URL`, plus IAM
  `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`. Lightsail can't assume IAM roles, so the API
  authenticates to S3 with a scoped IAM user's static keys (injected via `user-data`).
- **Mobile app:** out of scope / out of commission. Only the web client uploads.
- **Why our own bucket (not RERUM's):** the bucket behind the proxy is in **RERUM's AWS
  account**. We were given **object read/write credentials**, but not account/bucket-config
  access — so we cannot attach the S3-event->Lambda trigger, set CORS for presigned browser
  uploads, or apply lifecycle rules there, and staying in it keeps us coupled to RERUM. We
  provision our own bucket in our account.
- **RERUM credentials, used for migration:** the object-read creds let the migration copy
  originals out via the S3 API (reliable) rather than scraping public URLs.
- **RERUM originals:** left in place (no delete permission, and not our account). Migration
  copies objects into our bucket and rewrites our DB URLs; the RERUM copies become orphans.

## File size & type enforcement

Enforcement happens **inline at upload**, not as an after-the-fact scan, so there is no
"upload then check then delete" UX problem:

- **Client-side pre-check (UX):** check `file.size` against the category max before requesting
  the presign. Instant friendly error, no wasted upload/network.
- **`content-length-range` in the presigned POST (the real limit):** S3 validates the byte
  count during the POST and **rejects oversized uploads with a 403 — the object is never
  stored.** Unbypassable even if someone scripts around the UI.
- **`Content-Type` condition in the POST policy:** wrong types rejected the same way.
- **Residual (file lies about its type):** `sharp` in the Lambda simply fails to decode it and
  skips the thumbnail; optionally the Lambda deletes objects it can't decode. No UX impact.

## Thumbnail generation: Option A (decided) — S3 event -> Lambda (sharp)

Because the client uploads directly to S3, the server never sees the bytes, so thumbnail
generation lives off the request path:

- Client uploads the original directly to S3 (presigned POST).
- An **S3 `ObjectCreated` event** triggers a **Lambda** (sharp layer) that writes the
  thumbnail to a **deterministic key** (original `media/<uuid>.jpg` -> `media/thumb/<uuid>.webp`).
- Frontend uses the deterministic thumbnail URL and falls back to the original via `onError`
  until the thumbnail exists (~1 s lag).

Why: keeps the server off the byte path; one consistent path for both new uploads and the
migration (copying originals into the bucket auto-generates their thumbnails); consistent
quality; no server CPU; scales. Cost: a Lambda + sharp layer + S3 trigger to provision, and
brief eventual consistency.

(Rejected alternative: client-side thumbnail + two presigned uploads — needs a second resize
code path for the migration anyway, and quality varies by client.)

## Architecture (Option A)

```
Browser                         Node API (Lightsail)          S3 bucket            Lambda
  |  POST /api/media/presign  ->  requireAuth                    |                    |
  |     {filename, type, size}    build presigned POST           |                    |
  |  <- {url, fields, publicUrl, thumbnailUrl}                   |                    |
  |  POST file directly  ------------------------------------->  put media/<uuid>.jpg  |
  |                                                              |  ObjectCreated  ->  resize
  |                                                              |  put media/thumb/<uuid>.webp
  |  create/patch note with media {uri}  -> API -> Postgres                          |
Render: <img src={thumbUrl(uri)} onError -> uri>  ; lightbox uses uri ; served via CloudFront
```

## Components / Changes

### API (`packages/api`)
- Deps: `@aws-sdk/client-s3`, `@aws-sdk/s3-presigned-post` (respect pnpm min-release-age).
- `env.ts`: add `MEDIA_S3_BUCKET`, `AWS_REGION`, `S3_PUBLIC_BASE_URL` (+ optional creds).
- `lib/s3.ts`: S3 client singleton; `createPresignedPost(key, {maxBytes, contentType})`;
  public-URL builder; deterministic `thumbKey(originalKey)`.
- `routes/media.ts`: `POST /presign` (`requireAuth`) -> validates type against the allowlist,
  generates a date-partitioned UUID key, returns `{ url, fields, publicUrl, thumbnailUrl }`.
  Register `.route('/media', mediaRoutes)`.
- MIME/size allowlist (enforced via presigned POST conditions):

  | Category | Max size | Types |
  | --- | --- | --- |
  | Image | 10 MB | jpeg, png, gif, webp |
  | Video | 50 MB | mp4, quicktime, webm |
  | Audio | 25 MB | mpeg, wav, ogg |

### Lambda (`infrastructure/` + a small function package)
- Node + sharp layer; trigger on `media/` prefix `ObjectCreated`, skip `media/thumb/`.
- Resize to 1024px max edge WebP q80, put to `media/thumb/<uuid>.webp`.

### Web (`packages/web`)
- `utils/media.ts` (new): `thumbUrl(uri)` — for our-bucket image URLs, rewrite the key
  `media/<uuid>.<ext>` -> `media/thumb/<uuid>.webp`; pass through any non-matching URL
  unchanged (e.g. not-yet-migrated RERUM URLs).
- `utils/s3_proxy.ts`: replace the RERUM proxy call with: request presign from
  `/api/media/presign` (cookies), then POST the file to S3 directly; return the original
  `uri`. (Images derive their thumbnail; videos still upload + store a poster `thumbnail`.)
- Rendering: `thumbUrl(media.uri)` for images in `compact_carousel`, `note_card`,
  `NoteDetail` hero + attachments, with `onError` fallback to `uri`; **lightbox uses `uri`**.
  Video poster keeps using the stored `thumbnail` field.
- No `PhotoMedia` schema change needed (image thumbnails are derived, not stored).
- `.env`: drop `VITE_S3_PROXY_PREFIX`.

### Migration (`packages/api/src/scripts/migrate-media-to-s3.ts`)
- `--dry-run` default; batched; resumable; idempotent (skip already-migrated rows).
- Scope: **all** media — image originals, video files, audio. For videos, also copy + rewrite
  the poster (`media.thumbnailUri`).
- Per media row: GET original from RERUM's bucket via the RERUM S3 object creds (env, e.g.
  `RERUM_S3_*`) -> PUT to our bucket under the new key (image puts auto-trigger the Lambda ->
  thumbnail) -> update `media.uri` to the CloudFront URL. Image thumbnails are **derived** at
  render time (no per-row write); video posters get their `thumbnailUri` rewritten too.
- Log old->new URL mapping for rollback. Run after the Lambda is live so image thumbnails
  generate during the copy.

## Provisioning -- Terraform (`infrastructure/`, OpenTofu, manages AWS + Cloudflare)

Codified in IaC, not the console. Likely a new `infrastructure/media.tf`:

- `aws_s3_bucket` + `aws_s3_bucket_public_access_block` + ownership controls;
  `aws_s3_bucket_lifecycle_configuration` (Intelligent-Tiering on `media/` originals, Standard
  on `media/thumb/`); `aws_s3_bucket_cors_configuration` (allow `POST` from the web origin --
  **required** for presigned browser uploads).
- `aws_cloudfront_distribution` + `aws_cloudfront_origin_access_control` + bucket policy
  granting CloudFront read. Set `S3_PUBLIC_BASE_URL` to the distribution domain.
- **`aws_iam_user` + `aws_iam_user_policy` (`s3:PutObject`/`GetObject`) + `aws_iam_access_key`**
  -- Lightsail **cannot** assume IAM roles (no instance profile), so the API uses static keys.
- Lambda thumbnailer: `aws_iam_role` (execution), `aws_lambda_function` + **sharp layer**
  (`aws_lambda_layer_version` or container image -- native build for Amazon Linux),
  `aws_lambda_permission`, `aws_s3_bucket_notification` (ObjectCreated on `media/`, skip
  `media/thumb/`).
- Extend `main.tf`'s `templatefile(...)` + the `.env` heredoc in `scripts/user-data.sh` with
  `MEDIA_S3_BUCKET`, `AWS_REGION`, `S3_PUBLIC_BASE_URL`, and the IAM key/secret (same pattern
  as `db_password`). `outputs.tf`: bucket name + CloudFront domain.

Caveats:
- `aws_iam_access_key` stores the secret in **TF state** (state already holds `db_password`).
  Alternative: create the key out-of-band and pass it as a sensitive var.
- `user-data` runs at **instance creation**, so new env vars require a re-provision or a manual
  `.env` edit on the running instance (within the blue/green flow).

## Sequencing
1. Provisioning (bucket, IAM, CloudFront, lifecycle).
2. Lambda thumbnailer live + tested on a manual upload.
3. API presign endpoint + env.
4. Web upload rewrite + rendering (`thumbUrl(uri)`, onError fallback).
5. Verify new uploads end-to-end (original + thumbnail + render + lightbox).
6. Migration dry-run -> review counts/sizes -> batched migration -> spot-check.
7. Remove `VITE_S3_PROXY_PREFIX`; update `.env.example`s.

## Risks / gotchas
- **CloudFront caching the thumbnail 404.** With derive + ~1 s Lambda lag, the thumb URL is
  requested before it exists; CloudFront caches 4xx (default ~10 s) and could keep serving
  "not found" after the thumb lands. **Set error-caching min-TTL to 0 for 403/404** on the
  distribution (or only expose thumb URLs once generated).
- **Migration rewriting prod `media.uri` is the highest-risk step** — a bug points the whole
  site's images at dead URLs. Mitigations: dry-run, batched, idempotent, old->new rollback log.
  Go slow; verify a batch before continuing.
- **`sharp` on Lambda needs an arch-matched native build** (arm64 vs x86_64). Pin a prebuilt
  Amazon-Linux layer or package as a container image; verify in the actual runtime.
- **Eventual consistency in the uploader's own session:** right after upload the thumb may not
  exist yet, so the card shows the full-res original via `onError` until the next mount. Cosmetic.

## Verification
- Logged-out presign request -> 401; oversized/disallowed type -> rejected by S3 POST policy.
- Upload image -> original at CloudFront URL; thumbnail appears at `media/thumb/...` within ~1 s.
- Card/hero/attachment load the thumbnail (small bytes); lightbox loads the original.
- Re-run the DevTools trace: image-decode time and re-decodes drop sharply.
- Migration: old note renders from the new bucket; `thumbnailUri` populated; originals intact.

## Open questions
None — design fully settled. Next step is provisioning + code.

## Resolved
- **Bucket naming:** env-scoped `lrda-media-${var.environment}` (= `lrda-media-production`),
  matching the `lrda-${var.environment}` instance convention and leaving room for a future
  staging/dev bucket. The in-place-rename concern is moot (the staging->prod promotion is
  already complete; no further env flips).
- **IAM credentials:** created in Terraform (`aws_iam_user` + `aws_iam_access_key`); the secret
  lives in TF state, consistent with how `db_password` is already handled.
- **Image thumbnail URL:** **derived** on the frontend from the deterministic key
  (`media/<uuid>.<ext>` -> `media/thumb/<uuid>.webp`) with `onError` fallback to the original.
  No DB write for image thumbnails. (Video posters keep the stored `thumbnailUri`.)
- **Migration scope:** **full cutover** — copy all media (image originals, video files +
  posters, audio) into our bucket and rewrite every `uri`; nothing keeps serving from RERUM.
- **Thumbnail generation:** Option A — S3 event -> Lambda (sharp).
- **File size/type limits:** client-side pre-check + presigned POST `content-length-range` /
  `Content-Type` conditions (S3 rejects inline; nothing stored to clean up).
- **Mobile app:** out of scope.
- **RERUM originals:** left in place (no delete permission); migration copies out + rewrites
  our DB URLs.
```
