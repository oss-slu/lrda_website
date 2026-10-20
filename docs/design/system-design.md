# Where's Religion? — System Design Artifacts

Visual design artifacts for the Where's Religion? platform: the web app (this repo), the shared Hono API (this repo) and the mobile app ([`lrda_mobile`](https://github.com/oss-slu/lrda_mobile)).

All diagrams are [Mermaid](https://mermaid.js.org/) and render on GitHub. To edit one, paste it into [mermaid.live](https://mermaid.live).

**Legend used throughout:** solid line = current state · dashed line = planned or future state · **DEBT** = known technical debt (red nodes)

| # | Artifact | Type | Notation |
|---|---|---|---|
| 1 | [System architecture (current)](#1-system-architecture--current-state) | Component / deployment | C4-style container diagram |
| 2 | [System architecture (intended)](#2-system-architecture--intended-future-state) | Component / deployment | C4-style container diagram |
| 3 | [Data model](#3-data-model-erd) | Entity relationship | Crow's-foot ERD |
| 4 | [Note lifecycle (current vs. intended)](#4-note-lifecycle--state-diagrams) | State | UML state machine |
| 5 | [Create-note data flow](#5-data-flow--creating-a-note-with-media) | Data flow | UML sequence |
| 6 | [API architecture](#6-api-architecture--endpoint-groups-and-auth) | API endpoint map | Flowchart |
| 7 | [Web information architecture](#7-web-information-architecture) | Information architecture | Hierarchy flowchart |
| 8 | [CI/CD and deployment](#8-cicd-and-blue-green-deployment) | Deployment | Flowchart |
| 9 | [Technical debt map](#9-technical-debt-map) | Annotated summary | Table |

Mobile-specific artifacts (navigation, module layers, offline and media capture) are in [`lrda_mobile/docs/design/mobile-design.md`](https://github.com/oss-slu/lrda_mobile/blob/main/docs/design/mobile-design.md).

---

## 1. System architecture — current state

```mermaid
flowchart TB
  subgraph Users[" "]
    direction LR
    R["Researcher / Student<br/>(browser)"]
    A["Admin / Instructor<br/>(browser)"]
    M["Field researcher<br/>(iOS / Android)"]
  end

  subgraph Clients["Clients"]
    direction LR
    W["Web app<br/>TanStack Start, React 19 SSR<br/>Cloudflare Workers<br/><i>auth: session cookie</i>"]
    MOB["Mobile app<br/>Expo / React Native<br/>EAS + app stores<br/><i>auth: Bearer token</i>"]
  end

  CDN["Cloudflare DNS + CDN<br/>api.wheresreligion.org"]

  subgraph LS["AWS Lightsail - single VM"]
    direction LR
    NG["Nginx<br/>TLS, blue/green switch"] --> API["Hono API (Node.js, Docker)<br/>Zod-OpenAPI, Better Auth"]
    API --> PG[("PostgreSQL 17")]
    BK["Cron pg_dump<br/>daily, 7-day retention"] -.-> PG
  end

  subgraph EXT["Third-party services"]
    direction LR
    S3P["DEBT: RERUM S3 proxy<br/>unauthenticated"] --> S3[("S3 bucket<br/>RERUM-owned")]
    GM["Google Maps<br/>tiles, Geocoding, Places"]
    RS["Resend<br/>email"]
    OR["OpenRouter<br/>LLM tag suggestions"]
  end

  R & A --> W
  M --> MOB
  Clients -- "REST /api/*" --> CDN --> NG
  Clients -- "media file bytes" --> S3P
  Clients -- "map tiles" --> GM
  API -- "geocode, places" --> GM
  API --> RS
  API --> OR
  classDef debt fill:#fde2e2,stroke:#c0392b,color:#7b1d1d
  class S3P debt
```

**Key points**
- **One API, two clients.** The docs site (`docs.wheresreligion.org`) is also on Cloudflare Workers but is left out of the diagram.
- **Shared backend.** The web and mobile apps both use the same Hono API and PostgreSQL database. `@lrda/shared` (Zod schemas) is the contract between the API and the web app.
- **Different auth transport per client.** Web uses httpOnly session cookies. Mobile uses the Better Auth `bearer()` + `expo()` plugins, with the token kept in SecureStore.
- **DEBT: Media bypasses the API.** Both clients send file bytes straight to RERUM's unauthenticated proxy and store the returned URL on the note. We don't own that storage and there are no thumbnails.

---

## 2. System architecture — intended future state

The differences from §1 are drawn with dashed lines (sources: [`media-s3-thumbnails-plan.md`](../media-s3-thumbnails-plan.md), [`communities-design.md`](../communities-design.md)).

```mermaid
flowchart LR
  W["Web app<br/>(Cloudflare Workers)"]
  MOB["Mobile app<br/>(Expo)"]
  API["Hono API<br/>(Lightsail)"]
  PG[("PostgreSQL 17")]

  subgraph AWS["AWS — owned by the project"]
    B[("S3 bucket<br/>lrda-media-production")]
    L["Lambda<br/>thumbnail generator"]
    T[("thumbnails/ prefix")]
  end
  CDN2["CDN-cached media domain"]

  W -- "1. request upload" --> API
  MOB -- "1. request upload" --> API
  API -- "2. presigned POST<br/>(size + MIME limits)" --> W
  API -- "2. presigned POST" --> MOB
  W -. "3. direct upload" .-> B
  MOB -. "3. direct upload" .-> B
  B -. "S3 event" .-> L -. "resize" .-> T
  API --> PG
  B -. "serve" .-> CDN2
  T -. "serve" .-> CDN2

  OLD["RERUM S3 proxy"]:::retired
  classDef retired stroke-dasharray: 4 4,color:#999
```

| Area | Current | Intended |
|---|---|---|
| Media storage | RERUM proxy, no auth, full-size originals only | Project-owned S3, auth via presigned POST, Lambda thumbnails, all existing media migrated |
| Review model | Instructor ↔ student (`user.instructorId`) | Communities with owner / moderator / member roles (see §4) |
| Environments | Single production (staging was folded into production) | Unchanged |

---

## 3. Data model (ERD)

Source: `packages/api/src/db/schema.ts` (Drizzle). Better Auth owns `session`, `account` and `verification`.

```mermaid
erDiagram
  USER ||--o{ SESSION : "has"
  USER ||--o{ ACCOUNT : "auth providers"
  USER ||--o{ NOTE : "creates"
  USER ||--o{ COMMENT : "writes"
  USER |o--o{ USER : "instructor of (instructorId)"
  NOTE ||--o{ MEDIA : "images / videos"
  NOTE ||--o{ AUDIO : "recordings"
  NOTE ||--o{ COMMENT : "feedback"
  COMMENT |o--o{ COMMENT : "replies (parentId)"

  USER {
    text id PK
    text name
    text email UK
    bool emailVerified
    text role "user | admin"
    bool banned
    bool isInstructor
    text instructorId FK "self-ref"
    text pendingInstructorDescription
  }
  NOTE {
    text id PK
    text creatorId FK
    text title
    text text "HTML"
    jsonb textJson "Tiptap doc"
    double latitude
    double longitude
    text locationName "reverse-geocoded"
    bool isPublished
    bool approvalRequested
    bool isReturned
    jsonb tags "Tag[]"
    timestamp time "observation time"
  }
  MEDIA {
    text id PK
    text noteId FK
    text type "image | video"
    text uri "DEBT: RERUM URL"
    text thumbnailUri "mostly null today"
    text uuid "mobile client id"
  }
  AUDIO {
    text id PK
    text noteId FK
    text uri
    text name
    text duration
  }
  COMMENT {
    text id PK
    text noteId FK
    text authorId FK
    text authorName "denormalized"
    text text
    jsonb position "text range {from,to}"
    text threadId
    text parentId FK
    bool isResolved
  }
  SESSION {
    text id PK
    text userId FK
    text token UK
    timestamp expiresAt
    text impersonatedBy
  }
  ACCOUNT {
    text id PK
    text userId FK
    text providerId
    text password "hashed"
  }
  PAGEVIEW {
    text id PK
    text path
    text referrer
    text device
    text sessionHash "IP+UA hash, no PII"
  }
```

**Design decisions shown**
- **Tags live in a `jsonb` array on `note`, not a join table.** This keeps reads simple, but there's no tag vocabulary or tag-level querying yet.
- **Note text is stored twice:** `text` (HTML, used for search and previews) and `textJson` (Tiptap document, used for editing). DEBT: The two can drift apart.
- **Note status is three booleans, not a single enum.** DEBT: This permits invalid combinations (see §4).
- `pageView` stands alone and has no relationships, which keeps analytics free of PII by design.

---

## 4. Note lifecycle — state diagrams

### 4a. Current (instructor/student, derived from three booleans)

```mermaid
stateDiagram-v2
  [*] --> Draft
  Draft --> Published : independent user publishes<br/>isPublished=true
  Draft --> Pending : student "Request approval"<br/>approvalRequested=true
  Pending --> Draft : student cancels
  Pending --> Published : instructor approves
  Pending --> Returned : instructor declines<br/>isReturned=true + feedback comment
  Returned --> Pending : student revises & resubmits
  Published --> Draft : author unpublishes
  Published --> [*]
  note right of Draft
    DEBT: Status is computed by getNoteStatus()
    from isPublished / approvalRequested / isReturned.
    Nothing stops e.g. isPublished && isReturned.
  end note
```

### 4b. Intended (communities)

```mermaid
stateDiagram-v2
  [*] --> Draft
  Draft --> Published : no community<br/>(publish directly)
  Draft --> Published : community with review OFF
  Draft --> Submitted : community with review ON
  Submitted --> Published : moderator approves
  Submitted --> Draft : moderator returns with feedback
  Published --> [*]
```

**Trade-off:** the intended model replaces "one instructor per student" with "many communities per user". It needs new `community` and `community_member` tables and a single `status` enum in place of the three booleans.

---

## 5. Data flow — creating a note with media

The same flow runs on web and mobile; the differences are noted.

```mermaid
sequenceDiagram
  autonumber
  actor U as User
  participant C as Client (Web / Mobile)
  participant S3P as RERUM S3 proxy
  participant API as Hono API
  participant MW as Auth middleware
  participant G as Google Geocoding
  participant DB as PostgreSQL

  U->>C: Write note, attach photo/audio, pick location
  C->>S3P: POST /uploadFile (raw bytes)
  Note over C,S3P: DEBT: No auth. Mobile sends base64 on iOS and a URI on Android
  S3P-->>C: 201 Location: https://livedreligion.s3.../file
  C->>API: POST /api/notes {title, textJson, lat, lng, media[{uri}], tags}
  Note over C,API: Web uses a session cookie, mobile a Bearer token
  API->>MW: validate session
  MW-->>API: user
  API->>API: Zod-validate body (@lrda/shared)
  API->>G: reverse geocode (lat, lng)
  G-->>API: locationName
  API->>DB: INSERT note, media, audio (transaction)
  DB-->>API: note
  API-->>C: 201 note
  C->>C: TanStack Query invalidates notes list → map and library refresh
```

---

## 6. API architecture — endpoint groups and auth

Every route is defined with `@hono/zod-openapi`. Interactive docs are served at `/reference` (Scalar).

```mermaid
flowchart TB
  IN["HTTPS request /api/*"] --> CORS["CORS + logger"]
  CORS --> BA{"/api/auth/*?"}
  BA -- yes --> AUTH["Better Auth handler<br/>sign-up, sign-in, verify-email,<br/>reset-password, admin plugin"]
  BA -- no --> SES["Session middleware<br/>cookie OR Bearer → c.user"]

  SES --> PUB
  SES --> AUTHD
  SES --> ADM

  subgraph PUB["Public (user optional)"]
    H["GET /health"]
    NL["GET /notes · GET /notes/{id}<br/>(published only unless owner)"]
    CL["GET /comments/note/{noteId}"]
    PV["POST /analytics/pageview"]
  end

  subgraph AUTHD["Authenticated user"]
    NW["POST · PATCH · DELETE /notes/{id}<br/>GET /notes/students/{instructorId}"]
    CW["POST · PATCH · DELETE /comments<br/>POST /comments/thread/{id}/resolve"]
    US["GET · PATCH /users/me<br/>GET /users/instructors<br/>POST /users/me/instructor"]
    TG["POST /tags/generate → OpenRouter"]
    PL["GET /places/autocomplete · /details · /geocode<br/>→ Google (key stays server-side)"]
  end

  subgraph ADM["Admin (role = admin)"]
    AU["GET /admin/users · /stats · /content-stats<br/>/recent-activity"]
    AI["GET /admin/pending-instructors<br/>POST approve / reject-instructor/{id}"]
    AA["GET /admin/analytics/summary · /timeseries"]
  end

  PUB & AUTHD & ADM --> DZ["Drizzle ORM → PostgreSQL"]
```

**Decision:** Google Places calls go through `/api/places/*` so the server-side Maps key is never sent to the browser. Only the restricted map-display key is public (`VITE_MAP_KEY`).

---

## 7. Web information architecture

TanStack Router uses file-based routes (`packages/web/src/routes`). The `_public` and `_app` layouts decide the chrome, and `_authenticated` guards its routes.

```mermaid
flowchart TB
  ROOT["/ (root layout: nav + footer, analytics hook)"]

  ROOT --> PUBL["_public layout"]
  ROOT --> APP["_app layout"]

  PUBL --> HOME["/ Home<br/>hero · about intro · team"]
  PUBL --> ABOUT["/wheres-religion<br/>About, credits, citation"]
  PUBL --> RES["/resources"]
  PUBL --> STO["/stories"]
  PUBL --> NOTE["/notes/:id<br/>public note view"]
  PUBL --> AUTHP["Auth pages<br/>/login · /signup · /verify-email<br/>/forgot-password · /reset-password<br/>/confirm · /delete-account"]

  APP --> MAP["/map<br/>Explore map + sidebar"]
  APP --> ADMIN["/admin<br/>users · instructor approvals · analytics"]
  APP --> GUARD{{"_authenticated guard"}}
  GUARD --> NOTES["/notes<br/>My notes workspace + NoteEditor"]
  GUARD --> INST["/instructor-dashboard<br/>review student submissions"]

  HOME -. "Get Started" .-> AUTHP
  HOME -. "Explore the Map" .-> MAP
  HOME -. "Learn More" .-> ABOUT
  MAP -. "open note" .-> NOTE
```

`/`, `/resources` and `/wheres-religion` are pre-rendered and served as static assets.

---

## 8. CI/CD and blue/green deployment

```mermaid
flowchart LR
  DEV["Developer PR"] --> GH["GitHub Actions<br/>lint · typecheck · Vitest · Playwright"]
  GH -- "merge to main" --> SPLIT{changed package}

  SPLIT -- "packages/web" --> WB["wrangler deploy"] --> CFW["Cloudflare Workers"]
  SPLIT -- "packages/docs" --> DB["wrangler deploy"] --> CFD["docs.wheresreligion.org"]
  SPLIT -- "packages/api" --> IMG["docker build → GHCR"]

  IMG --> SSH["SSH to Lightsail<br/>deploy.sh"]
  SSH --> IDLE["Start idle color<br/>(blue :3002 / green :3003)"]
  IDLE --> HC{"/api/health OK?"}
  HC -- yes --> SWAP["Rewrite Nginx upstream<br/>reload"] --> STOP["Stop old color"]
  HC -- no --> KEEP["Keep current color live<br/>(automatic rollback)"]

  TF["Terraform (manual)<br/>Lightsail + Cloudflare DNS/cert"] -.-> SSH
```

The mobile app ships separately through EAS Build / app stores (see the mobile design doc).

---

## 9. Technical debt map

| Debt | Where | Impact | Planned fix |
|---|---|---|---|
| Unauthenticated third-party media storage | `utils/s3_proxy.ts` (web), `lib/utils/S3_proxy.ts` (mobile) | Anyone can upload; data lives outside the project | Presigned S3 + Lambda (§2) |
| No thumbnails; 8 MP originals shown at 256 px | Map sidebar, cards | About 5.6 s spent decoding images on the note detail page | Thumbnail pipeline (§2) |
| Note status as three booleans | `note` table, `getNoteStatus()` | Invalid states are possible | `status` enum with communities (§4b) |
| Duplicated note body (`text` + `textJson`) | `note` table | HTML and JSON can disagree | Derive HTML from JSON on write |
| Single VM runs API + DB + backups | Lightsail | Single point of failure; backups stay on the same disk unless S3 is configured | Turn on off-box S3 backups first, then consider managed Postgres |
| Mobile architecture doc is out of date | `packages/docs/mobile/architecture.md` | Describes Redux / React Navigation / Yarn, but the app uses Zustand / expo-router / pnpm | Replace with `lrda_mobile/docs/design` |
| Mobile has no shared schema package | `lrda_mobile/types.ts` | API contract can drift without notice | Publish `@lrda/shared` for mobile to import |
