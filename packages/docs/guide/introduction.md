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
