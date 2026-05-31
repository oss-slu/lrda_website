# Introduction

**Where's Religion?** is an open-source web platform built by students at Saint Louis University for documenting and mapping encounters with lived religion in everyday places. Researchers, students, and instructors use it to create rich-text notes anchored to geographic locations, then browse and analyze those notes on an interactive map.

## What You Can Do

- **Create notes** with rich text formatting, embedded images, audio, and video
- **Pin notes to locations** using Google Maps with precise coordinate selection
- **Tag and organize** notes for thematic research
- **Browse geographically** on an interactive map with clustering and filtering
- **Collaborate** through an instructor/student review workflow with comments and approval

## How It's Built

The platform consists of three main components:

- **Web app** ([`lrda_website`](https://github.com/oss-slu/lrda_website)): [TanStack Start](https://tanstack.com/start) (React 19 + Vite), deployed to Cloudflare Workers
- **Mobile app** ([`lrda_mobile`](https://github.com/oss-slu/lrda_mobile)): Expo + React Native for iOS and Android
- **Backend API**: [Hono](https://hono.dev/) REST API with [Drizzle ORM](https://orm.drizzle.team/) on PostgreSQL, deployed to AWS Lightsail via Docker
- **Authentication**: [Better Auth](https://www.better-auth.com/) (session-based, self-hosted) for web; Firebase Auth for mobile (migrating)

See the [Architecture Overview](/architecture/overview) and [Mobile Overview](/mobile/overview) for deeper looks.

## History

The platform was originally built on **RERUM** (a shared Linked Data research infrastructure at SLU) for data storage and **Firebase** for authentication. The web app was a Next.js application hosted on Netlify with domains on GoDaddy.

In Spring 2026, the entire web application was migrated to an AWS + Cloudflare stack:

- **RERUM** was replaced with a Hono API server backed by PostgreSQL and Drizzle ORM, deployed to AWS Lightsail. RERUM stored notes as JSON-LD documents in MongoDB, which made simple queries unnecessarily complex and slow. It was also shared research infrastructure we did not control -- we could not add features like full-text search, analytics, or custom auth flows without working around someone else's system. Our RERUM usage was also highly insecure at the time, with no authentication on database modifications.
- **Firebase Auth** was replaced with Better Auth (session-based, self-hosted). Firebase was adding complexity for what amounted to basic email/password auth.
- **Next.js** was replaced with TanStack Start (Vite + TanStack Router), deployed to Cloudflare Workers.
- **Netlify** hosting and **GoDaddy** domains were both migrated to **Cloudflare**, giving us bot protection, edge deployment, and unified domain management.

During the transition, sync scripts keep RERUM and PostgreSQL in sync so the mobile app (which still uses RERUM) continues to work. See [Migration Status](/mobile/migration) for details on what remains.

**Media storage** currently goes through a Java proxy server (`s3-proxy.rerum.io`) managed by the RERUM team at SLU. The plan is to migrate media to our own S3 or Cloudflare R2 storage so we fully own the data pipeline.

## Decision Framework

When deciding what to work on, ask these questions in order (from the [Spring 2026 product strategy](https://docs.google.com/document/d/13fhRA_dd_luHN1J3fx27BhLQRHPZJ12KqWHNqEOrYEg/edit?usp=sharing)):

1. **Does it make the platform more stable or reliable?** The client's top priority is that the platform just works well without bugs or data loss.
2. **Does it help with the classroom use case?** Instructors adopting the platform for courses is the primary growth mechanism.
3. **Does it improve the experience for someone capturing a note in the field?** This is the core workflow.
4. **Does it help with grant applications or institutional adoption?** Analytics, FAIR compliance, and polished public pages fall here.
5. **Is it cool but not essential?** Put it in the backlog and revisit when the above are covered.

## Who This Is For

- **New contributors** looking to set up the project and start developing
- **Students** learning full-stack web development in a real OSS project
- **Instructors** understanding the platform's features and workflows
- **Maintainers** needing architecture and deployment references

## Next Steps

- [Quick Start](/guide/quick-start) -- get the web app running locally in 5 minutes
- [Project Structure](/guide/project-structure) -- understand the monorepo layout
- [Mobile App](/mobile/overview) -- learn about the companion mobile app
- [API Reference](/api/overview) -- explore the REST API endpoints
- [Contributing](/contributing/getting-started) -- learn how to contribute
