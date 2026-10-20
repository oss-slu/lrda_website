# System Design Checkpoint — Context (Website + API)

**Artifacts:** [`system-design.md`](./system-design.md) (9 diagrams) · Mobile companion: [`lrda_mobile/docs/design/mobile-design.md`](https://github.com/oss-slu/lrda_mobile/blob/main/docs/design/mobile-design.md)
**Source format:** Mermaid inside Markdown, stored in the repo so the diagrams are versioned with the code and render on GitHub. To edit one, paste it into [mermaid.live](https://mermaid.live).

## What we created and why

Where's Religion? is an **existing product**: two clients (web and mobile) share one API and database, and the team changes every semester. The biggest risk is new contributors misreading how the parts connect, so we chose artifacts that show **structure, data and change** rather than visual design:

| Artifact | Why this type |
|---|---|
| System architecture, current and intended (C4-style) | Shows the one-API / two-client split and every third-party dependency in a single view |
| Data model (crow's-foot ERD) | `schema.ts` is the source of truth both clients depend on |
| Note lifecycle, current and intended (UML state) | Publishing and review is the most complex business rule, and it is about to change |
| Create-note sequence (UML sequence) | Shows that media uploads skip the API, which is easy to miss in the code |
| API endpoint map | Shows each endpoint's auth level at a glance (public, user, admin) |
| Web information architecture | Shows how the client's content requests map to routes |
| CI/CD and blue/green deploy | Shows how a merge reaches production and how rollback happens |
| Technical debt map | Turns the "DEBT" markers in the diagrams into a prioritized list |

## Key decisions and trade-offs illustrated

- **One shared API for both clients.** Business rules live in one place. In exchange, web uses cookies and mobile uses Bearer tokens, so auth middleware has to support both.
- **OpenAPI-first routes with shared Zod schemas.** Request validation and API docs come for free. Mobile doesn't use the shared package yet, so its types can drift.
- **Single Lightsail VM with blue/green containers.** Cheap (about $10/month) with zero-downtime deploys. The cost is a single point of failure, with the database and backups on the same machine.
- **Tags and note status kept inline on `note`.** Queries stay simple, but invalid status combinations are possible.

## Current vs. intended state

| Area | Current | Intended |
|---|---|---|
| Media | Unauthenticated RERUM proxy, full-size images only | Project-owned S3 with presigned uploads and Lambda thumbnails |
| Review workflow | Instructor/student, three boolean flags | Communities (owner / moderator / member), one `status` enum |
| Mobile docs | Website docs describe Redux and React Navigation | Replaced by the mobile design doc (Zustand, expo-router) |

## How these inform development

1. **Next milestone:** the media migration (§2, §5). It removes the largest security gap and the main performance bottleneck for both clients at once.
2. **Communities work** should start from the state diagram in §4b and the ERD in §3. That means adding `community` and `community_member` tables and replacing the three booleans with a `status` enum.
3. **Onboarding:** new contributors read §1, §3 and §7 before picking up their first issue.
4. **Maintenance rule:** a PR that changes `schema.ts`, adds a route or adds an external service must update the matching diagram in the same PR.
