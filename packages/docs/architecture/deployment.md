# Deployment

The application has two separate deployment targets: Cloudflare Workers for the frontend, and AWS Lightsail with Docker for the API.

## Service Accounts

| Service | Account | Notes |
| --- | --- | --- |
| **Cloudflare** | `lrda.adam.park@gmail.com` (owner) | Jacob Maynard added as super admin |
| **AWS** | SLU-provided account (288757603000) | IAM user `jacob.maynard@slu.edu`. Contact SLU for new IAM users. |
| **Google Cloud** | `lrda.adam.park@gmail.com` | Maps API keys for both client and server |
| **Resend** | `lrda.adam.park@gmail.com` | Sending domain: `wheresreligion.org` |
| **OpenRouter** | Jacob Maynard (personal) | $2 spend limit on the production key |
| **GHCR** | GitHub org (`oss-slu`) | Access is automatic for repo collaborators |

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

### Instance Bootstrap

When Terraform provisions a new Lightsail instance, it runs `infrastructure/scripts/user-data.sh` as a cloud-init script. This is a one-time setup that installs and configures:

- **Docker CE** -- runs the API containers
- **PostgreSQL 17** -- installed natively (not containerized). Creates the `lrda_app` user, the `lrda_{environment}` database, and enables `pgcrypto`.
- **Nginx** -- reverse proxy terminating TLS with a Cloudflare Origin CA certificate (injected by Terraform). Proxies to the `lrda_api` upstream, which `deploy.sh` switches between blue/green ports.
- **`.env` file** -- generated at `/home/ubuntu/lrda/.env` with database credentials, a generated `BETTER_AUTH_SECRET`, and placeholder values for optional services (Resend, Google Maps). Not managed by CI -- update manually via SSH.
- **`docker-compose.prod.yml`** -- blue (port 3002) and green (port 3003) API containers. Green uses a Docker Compose profile and is only started during deploys.
- **Daily database backup** -- cron at 3am UTC runs `backup-db.sh`, which `pg_dump`s to `/home/ubuntu/backups/db/` with 7-day retention. Optionally uploads to S3 if `BACKUP_S3_BUCKET` is set.

The bootstrap log is at `/var/log/user-data.log` on the instance.

### Infrastructure

- **Instance**: AWS Lightsail (~$10/mo), static IP `54.161.92.65`
- **Database**: PostgreSQL 17 on the same instance
- **Networking**: `network_mode: host` -- containers bind directly to host ports
- **SSL**: Cloudflare Origin CA certificate, terminated at Nginx
- **SSH**: `ssh -i ~/.ssh/<your-key>.pem ubuntu@54.161.92.65`

## Documentation (Cloudflare Workers)

This documentation site deploys to Cloudflare Workers at `docs.wheresreligion.org`. The GitHub Actions workflow triggers automatically when changes to `packages/docs/` are pushed to `main`.

```bash
pnpm deploy:docs   # Manual deploy
```

## GitHub Actions Secrets

### API deployment

| Secret | Purpose |
| --- | --- |
| `LIGHTSAIL_HOST` | IP or hostname of the Lightsail instance |
| `LIGHTSAIL_SSH_PRIVATE_KEY` | SSH private key (PEM) for the `ubuntu` user |
| `API_DOMAIN` | Domain for post-deploy health check (e.g., `api.wheresreligion.org`) |

`GITHUB_TOKEN` is automatic and used for GHCR (GitHub Container Registry) authentication.

### Web and docs deployment

| Secret | Purpose |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token (shared by web and docs deploys) |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID (docs deploy only) |
| `VITE_API_URL` | Production API URL (web deploy only) |
| `VITE_MAP_KEY` | Google Maps JavaScript API key (web deploy only) |
| `VITE_MAP_ID` | Google Maps Map ID (web deploy only) |

`VITE_S3_PROXY_PREFIX` is hardcoded in the workflow as `https://s3-proxy.rerum.io/S3/`.

The Cloudflare API token is created in the [Cloudflare dashboard](https://dash.cloudflare.com/profile/api-tokens) under the `lrda.adam.park@gmail.com` account. Both web and docs deploy via `wrangler deploy` (Workers, not Pages). The token needs these permission scopes:

- **Workers Scripts: Edit** -- for `wrangler deploy`
- **Account Settings: Read** -- required by wrangler for account discovery
- **Zone: Read** -- if using custom domains

### Infrastructure (Terraform)

See [`infrastructure/README.md`](https://github.com/oss-slu/lrda_website/blob/main/infrastructure/README.md) for Terraform variables and GitHub secrets.

## Rollback

### API

Switch Nginx back to the previous container color:

```bash
# SSH to Lightsail instance
ssh -i ~/.ssh/<key-pair-name>.pem ubuntu@<lightsail-ip>

# Check which color is active
cat /etc/nginx/conf.d/upstream-api.conf

# If green (3003) is active and you want to switch back to blue (3002):
echo 'upstream lrda_api { server 127.0.0.1:3002; }' | sudo tee /etc/nginx/conf.d/upstream-api.conf
sudo systemctl reload nginx
docker compose -f docker-compose.prod.yml stop api-green
```

Database migrations are not automatically rolled back. If a migration needs reverting, write a new migration that undoes the changes.

### Web

Cloudflare Workers deployments can be rolled back from the Cloudflare dashboard, or by re-deploying a previous commit.

## Manual Deployment

### API

```bash
ssh -i ~/.ssh/<key-pair-name>.pem ubuntu@<lightsail-ip>
cd /home/ubuntu/lrda
export GITHUB_REPOSITORY=oss-slu/lrda_website
export IMAGE_TAG=sha-<commit-hash>
echo "<github-token>" | docker login ghcr.io -u <github-user> --password-stdin
sudo -E ./deploy.sh "${IMAGE_TAG}"
```

### Web

```bash
cd packages/web
CLOUDFLARE_API_TOKEN=<token> \
VITE_API_URL=https://api.wheresreligion.org \
VITE_MAP_KEY=<key> \
VITE_MAP_ID=<id> \
pnpm run deploy
```

## Adding a New Environment Variable

### API

1. Add it to the Zod schema in `packages/api/src/env.ts`
2. Add it with a description to `packages/api/.env.example`
3. If required in production: SSH to Lightsail and add it to `/home/ubuntu/lrda/.env`, then restart the active container
4. If needed at build/deploy time: add it as a GitHub Actions secret and reference it in `deploy.yml`

### Web

1. Add it (with `VITE_` prefix) to `packages/web/.env.example`
2. If needed in production: add as a GitHub Actions secret in `deploy-web.yml` and/or in `wrangler.jsonc` under `vars`

All `VITE_` variables are exposed to the browser -- never put secrets in them.

## Verifying a Deployment

The API deploy workflow automatically curls the health endpoint after switching Nginx. 
The health check returns the current color. To check manually:

```bash
curl https://api.wheresreligion.org/api/health
```

To inspect the Lightsail instance:

```bash
ssh -i ~/.ssh/<key-pair-name>.pem ubuntu@<lightsail-ip>
docker compose -f /home/ubuntu/lrda/docker-compose.prod.yml ps
cat /etc/nginx/conf.d/upstream-api.conf
docker compose -f /home/ubuntu/lrda/docker-compose.prod.yml logs -f api-blue
```

## Key Files

| File | Purpose |
| --- | --- |
| `packages/web/wrangler.jsonc` | Cloudflare Workers config |
| `packages/api/Dockerfile` | Multi-stage Docker build for the API |
| `infrastructure/scripts/deploy.sh` | Blue/green deploy script (runs on Lightsail) |
| `.github/workflows/deploy.yml` | API deployment workflow |
| `.github/workflows/deploy-web.yml` | Web deployment workflow |
| `.github/workflows/deploy-docs.yml` | Docs deployment workflow |
| `infrastructure/` | Terraform configs and bootstrap scripts |
