# Kept for archival purposes

# Staging -> Production Migration

Plan for promoting the LRDA staging environment to production and decommissioning
staging. Persisted so it survives across sessions. Check off steps as they complete.

## Goal & Decisions

- **Goal:** Migrate staging into production, then have **no** staging environment.
- **Approach:** In-place promotion of the single Terraform state (NOT a parallel
  second environment). Flip `environment` from `staging` -> `production` in the
  existing `default` workspace. Downtime is acceptable.
- **Web domain:** Keep the web app on `staging.wheresreligion.org` during validation;
  switch the route to the apex (`wheresreligion.org`) later, after everything is verified.

### Why in-place (not a parallel prod env)

The single local Terraform state (`default` workspace) manages **zone-level Cloudflare
singletons** alongside the instance:

- `cloudflare_ruleset.cache` -- Cloudflare allows only **one ruleset per phase per
  zone**, so a second environment would collide.
- Zone settings, origin CA cert, and the `api` DNS record all live in the same state.

Spinning up a separate `production` workspace would fight over those zone resources,
and tearing staging down afterward would delete the cache ruleset / zone settings that
prod depends on. In-place promotion avoids all of that:

- **Replaces** `aws_lightsail_instance.web` (`lrda-staging` -> `lrda-production`) and the
  static IP (-> **new public IP**); the staging instance is destroyed.
- **Updates** the `api` DNS record `api-staging` -> `api.wheresreligion.org` at the new IP.
- **Leaves** zone settings, cache ruleset, and origin cert untouched (the cert already
  lists `api.wheresreligion.org`; the cache rule `starts_with(http.host,"api")` already
  matches it).

## Current state (baseline)

- **API:** `lrda-staging` Lightsail instance at `44.219.215.8` -> `api-staging.wheresreligion.org`, DB `lrda_staging`.
- **Web:** single Cloudflare Worker `lrda-web` -> `staging.wheresreligion.org`.
- **Terraform:** single local state, `default` workspace.
- **GitHub deploy secrets are repo-level** (not scoped to the `staging`/`production`
  GitHub Environments, which have no secrets of their own). Relevant ones:
  `LIGHTSAIL_HOST`, `API_DOMAIN`, `VITE_API_URL`, `LIGHTSAIL_SSH_PRIVATE_KEY`.
- SSH: `ssh -i ~/.ssh/lrda-ec2.pem ubuntu@<host>`, key pair `lrda-ec2`.

## Gotchas

1. **Instance + IP are replaced -> new IP + downtime window.** Mitigate with a DB dump
   AND a Lightsail snapshot before applying.
2. **Web must be repointed even while staying on the staging route** -- it currently
   calls `api-staging.wheresreligion.org`, which gets destroyed. Set its API URL to
   `https://api.wheresreligion.org` and redeploy.
3. **CORS blocks the validation window.** Prod `.env` sets `CORS_ORIGINS=https://wheresreligion.org`
   only. While the web is served at `staging.wheresreligion.org` but hitting the prod
   API, temporarily add `https://staging.wheresreligion.org` to `CORS_ORIGINS` on the box.
4. **GitHub deploy secrets** `LIGHTSAIL_HOST` / `API_DOMAIN` / `VITE_API_URL` still point
   at staging -- update to the new IP and prod domains.
5. **Backup cron** defaulted to `lrda_staging` -- fixed in `user-data.sh` (Phase 0).

---

## Phase 0 -- In-repo prep (DONE)

- [x] `infrastructure/terraform.tfvars`: `environment = "production"` (trigger for the apply)
- [x] `.github/workflows/deploy.yml`: target `production` (choice option + both `|| 'staging'` fallbacks)
- [x] `infrastructure/scripts/user-data.sh`: backup cron passes `DB_NAME=lrda_${environment}`

Note: the `deploy.sh` that `user-data.sh` writes uses the `upstream-blue.conf` /
`upstream-green.conf` swap convention (internally consistent). The single-`upstream-api.conf`
version in `docs/docker-blue-green-deploy-plan.md` is stale -- no action needed.

## Phase 1 -- Back up staging (safety net) -- DONE

- [x] Lightsail snapshot (`lrda-staging-pre-prod-migration`, started 2026-05-28)
- [x] DB dump pulled local (`lrda_staging.dump`, 766K, 13 tables; `*.dump` now gitignored)

```bash
aws lightsail create-instance-snapshot \
  --instance-name lrda-staging \
  --instance-snapshot-name lrda-staging-pre-prod-migration \
  --region us-east-1

ssh -i ~/.ssh/lrda-ec2.pem ubuntu@44.219.215.8 \
  'sudo -u postgres pg_dump -Fc lrda_staging > /tmp/lrda_staging.dump'
scp -i ~/.ssh/lrda-ec2.pem ubuntu@44.219.215.8:/tmp/lrda_staging.dump ./lrda_staging.dump
```

## Phase 2 -- Apply (DOWNTIME STARTS -- staging destroyed) -- DONE

NOTE: infra uses **OpenTofu** (`tofu`), not Terraform. Lock file points at
`registry.opentofu.org`. Use `tofu init/plan/apply`. (Repo `terraform` 1.5.7 is too old.)

- [x] `tofu plan` reviewed: replaced instance + static_ip + public_ports; updated api DNS
      (`api-staging` -> `api`, new IP); origin cert reissued (cosmetic hostname reorder only);
      `tls_1_3` zone setting drift `zrt`->`on` (benign). Cache ruleset untouched.
- [x] `tofu apply` (5 added, 2 changed, 5 destroyed)
- [x] New prod box: **`lrda-production` @ `54.161.92.65`**, `api.wheresreligion.org`

```bash
cd infrastructure
tofu init      # if providers not present this session
tofu plan -out=tfplan.bin
tofu apply tfplan.bin
tofu output
```

## Phase 3 -- Restore data + configure prod box -- DONE

New box bootstraps via `user-data.sh` (~3-5 min; creates empty `lrda_production`).

- [x] `pg_restore` into `lrda_production` (1653 notes, 1743 media, 314 users, etc.;
      only benign `COMMENT ON EXTENSION pgcrypto` error ignored)
- [x] Merged `.env` secrets from local `packages/api/.env`: RESEND_API_KEY,
      OPENROUTER_API_KEY, OPENROUTER_MODELS, RERUM_API_URL. CORS widened to include
      `https://staging.wheresreligion.org` for the validation window.
      NOTE: `GOOGLE_MAPS_API_KEY` left BLANK (not in local .env; optional -- used only for
      server-side reverse geocoding of note coords in `notes.ts`/`lib/geocode.ts`).
      NOTE: `BETTER_AUTH_SECRET` is freshly generated by user-data (!= staging) -> existing
      sessions invalid, users must re-login.
- [x] Updated repo secrets `LIGHTSAIL_HOST=54.161.92.65`, `API_DOMAIN=api.wheresreligion.org`
- [x] Deployed API via Actions "Deploy API" (production). Unit tests pass in CI; e2e
      cannot run in CI (not gated). Image built + pushed to GHCR + SSH blue/green deploy.
- [x] `https://api.wheresreligion.org/api/health` -> 200, database connected, env production,
      container `lrda-api-green` healthy.

GHCR images are private; local `gh` token lacks `read:packages`, so box-direct pulls need
the Actions path (uses workflow GITHUB_TOKEN) or a PAT.

```bash
NEW_IP=<from terraform output>
scp -i ~/.ssh/lrda-ec2.pem ./lrda_staging.dump ubuntu@$NEW_IP:/tmp/
ssh -i ~/.ssh/lrda-ec2.pem ubuntu@$NEW_IP

# on the box:
sudo -u postgres pg_restore -d lrda_production /tmp/lrda_staging.dump
sudo nano /home/ubuntu/lrda/.env
#   RESEND_API_KEY=...
#   GOOGLE_MAPS_API_KEY=...
#   OPENROUTER_API_KEY=...            <- not written by user-data, add it
#   OPENROUTER_MODELS=google/gemini-2.0-flash-001,openai/gpt-4o-mini
#   CORS_ORIGINS=https://wheresreligion.org,https://staging.wheresreligion.org

# back on local:
gh secret set LIGHTSAIL_HOST -b"$NEW_IP"
gh secret set API_DOMAIN     -b"api.wheresreligion.org"
# then run the Deploy API workflow (production), then:
curl https://api.wheresreligion.org/api/health
```

The full dump includes `drizzle.__drizzle_migrations`, so `drizzle-kit migrate` during
deploy no-ops -- schema and data come from the restore.

## Phase 4 -- Repoint web (keep staging route) -- DONE

- [x] `packages/web/wrangler.jsonc` `vars.VITE_API_URL` -> `https://api.wheresreligion.org` (route stays `staging.wheresreligion.org`); committed in `1b354890`
- [x] `gh secret set VITE_API_URL -b"https://api.wheresreligion.org"` (repo secret)
- [x] Web redeployed (Deploy Web auto-triggered on push)
- [x] `https://staging.wheresreligion.org` -> 200; CORS preflight staging-origin -> prod API
      returns 204 with `access-control-allow-origin` + `allow-credentials`. **DOWNTIME ENDED.**
- [ ] Manual functional check still recommended: log in (sessions were reset by the new
      BETTER_AUTH_SECRET), create/view a note, load the map.

Repo secrets updated (all via `gh secret set`, no manual UI work needed):
`LIGHTSAIL_HOST=54.161.92.65`, `API_DOMAIN=api.wheresreligion.org`,
`VITE_API_URL=https://api.wheresreligion.org`. SSH key / Cloudflare token / map keys unchanged.

## Phase 5 -- Switch domain over (later)

- [ ] `packages/web/wrangler.jsonc`: route -> apex `wheresreligion.org` (+ `www` if desired), remove `staging.wheresreligion.org` route
- [ ] Tighten `CORS_ORIGINS` on the box back to `https://wheresreligion.org` only
- [ ] (`api-staging.wheresreligion.org` already removed in Phase 2)

## Cleanup

- [ ] Securely delete the local `lrda_staging.dump` (contains real user data / sessions)
- [ ] Optionally delete the pre-migration Lightsail snapshot once stable
