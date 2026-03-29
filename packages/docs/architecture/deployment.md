# Deployment

The application has two separate deployment targets: Cloudflare Workers for the frontend, and AWS Lightsail with Docker for the API.

## Web Frontend (Cloudflare Workers)

The TanStack Start application deploys to Cloudflare Workers using Wrangler.

```bash
pnpm deploy:web   # Build and deploy to Cloudflare Workers
```

Configuration is in `packages/web/wrangler.jsonc`. Pre-rendered pages (`/`, `/resources`, `/wheres-religion`) are served as static assets for fast initial loads.

## API Server (AWS Lightsail + Docker)

The API runs on a single Lightsail instance with Docker containers managed by a blue/green deploy script.

### Blue/Green Deploys

The deployment uses two containers (blue and green) behind Nginx:

1. **Blue** listens on port 3002, **Green** on port 3003
2. Nginx reverse-proxies to the active container
3. On deploy: build new image, start the inactive container, health check, swap Nginx config, stop the old container

This provides zero-downtime deployments.

### CI/CD Pipeline

Deployments are triggered via GitHub Actions:

1. Push to `main` triggers the deploy workflow
2. Docker image is built and pushed to GitHub Container Registry (GHCR)
3. The workflow SSHs into the Lightsail instance
4. The deploy script pulls the new image and performs the blue/green swap

### Infrastructure

- **Instance**: AWS Lightsail ($10/mo, 2GB RAM)
- **Database**: PostgreSQL 17 running on the same instance
- **Networking**: `network_mode: host` -- containers bind directly to host ports
- **SSL**: Managed via Nginx with Let's Encrypt certificates

## Documentation (Cloudflare Workers)

This documentation site deploys to Cloudflare Workers at `docs.wheresreligion.org`. The GitHub Actions workflow triggers automatically when changes to `packages/docs/` are pushed to `main`.

```bash
pnpm deploy:docs   # Manual deploy
```

## Key Files

| File | Purpose |
| --- | --- |
| `packages/web/wrangler.jsonc` | Cloudflare Workers config |
| `.github/workflows/deploy.yml` | API deployment workflow |
| `.github/workflows/deploy-web.yml` | Web deployment workflow |
| `.github/workflows/deploy-docs.yml` | Docs deployment workflow |
| `infrastructure/` | Lightsail setup and deploy scripts |
