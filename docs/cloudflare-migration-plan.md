# Cloudflare Migration Plan

Migrate domain, DNS, frontend hosting, and SSL off GoDaddy/Netlify/Let's Encrypt onto Cloudflare. The API stays on AWS EC2 but is proxied through Cloudflare for DDoS protection and automatic SSL.

---

## Current State

| Component | Current Provider | Details |
|-----------|-----------------|---------|
| Domain registration | ~~GoDaddy~~ **Cloudflare** | `wheresreligion.org` -- **DONE** |
| Nameservers | ~~GoDaddy~~ **Cloudflare** | **DONE** |
| Frontend hosting | Netlify | Next.js via `@netlify/plugin-nextjs` |
| API hosting | AWS EC2 (planned) | Hono + PostgreSQL, Docker blue/green deploy |
| SSL (frontend) | Netlify (automatic) | -- |
| SSL (API) | Not yet set up | -- |
| DNS records | Cloudflare | Managed via OpenTofu (`infrastructure/cloudflare.tf`) |
| Email | None | No MX/SPF/DKIM records |

## Target State

| Component | New Provider | Details |
|-----------|-------------|---------|
| Domain registration | Cloudflare Registrar | At-cost pricing (~$10-12/yr vs ~$20-25/yr GoDaddy) |
| Nameservers | Cloudflare | -- |
| Frontend hosting | Cloudflare Workers | Next.js via `@opennextjs/cloudflare` |
| API hosting | AWS EC2 (unchanged) | Proxied through Cloudflare |
| SSL (frontend) | Cloudflare (automatic) | Edge SSL termination |
| SSL (API) | Cloudflare Origin Certificate | 15-year cert, no renewal needed |
| DNS records | Cloudflare | All records managed in Cloudflare dashboard |
| DDoS protection | Cloudflare (free tier) | EC2 IP hidden behind proxy |

---

## Architecture

```
                     Cloudflare Edge
                     +-------------------------------+
  Client --HTTPS-->  |  DNS + SSL termination        |
                     |                                |
                     |  wheresreligion.org --> Worker  |  (Next.js via OpenNext)
                     |  api.wheresreligion.org ------>-|--HTTPS--> EC2 Nginx (origin cert)
                     |  api-staging.wheresreligion.org |                |
                     +-------------------------------+          [blue/green Docker]
                                                                       |
                                                                 [PostgreSQL]
```

- Frontend: Cloudflare Worker (replaces Netlify)
- API subdomains: Cloudflare proxies (orange cloud) to EC2 with Origin Certificate
- EC2 public IP: Hidden behind Cloudflare proxy

---

## Impact Analysis

### Mobile App (`lrda_mobile`)

**Impact: None.** The mobile app talks exclusively to RERUM (`lived-religion-dev.rerum.io`) and Firebase (`lrda-75cf4.firebaseapp.com`). It does not use `wheresreligion.org` for any backend connectivity.

The only reference is a hardcoded "Visit Website" link in `lib/screens/MorePage.tsx:189`:
```typescript
const websiteUrl = "https://www.wheresreligion.org";
```
This continues to work since the domain stays the same.

The RERUM sync scripts (`packages/api/src/scripts/sync-*.ts`) run server-side on EC2 -- unaffected by DNS or hosting changes.

### Web App Cloudflare Workers Compatibility

**Compatibility: Excellent.** Only cosmetic cleanup needed, no blockers.

| Item | Status | Notes |
|------|--------|-------|
| Server Components | Compatible | `getServerUser()` uses `cookies()` from `next/server` -- supported by OpenNext |
| API Routes | Compatible | `api/s3-local/` uses `Buffer.from()` but is only used in local dev, not production |
| Middleware | N/A | No middleware file exists |
| Server Actions | N/A | No `'use server'` directives |
| Client Libraries | Compatible | Google Maps, Tiptap, jsPDF, docx, file-saver -- all client-side |
| Auth | Compatible | Better Auth uses standard fetch + cookies |
| Node.js APIs | None used | No `fs`, `path`, `crypto`, `child_process`, `__dirname`, `require()` |
| `process.env` | Compatible | Works in Workers with proper config |
| Router | Compatible | App Router only, no Pages Router legacy |

**Cleanup (optional):**
- Remove unused `sharp` dependency from `packages/web/package.json` (zero imports)

---

## Migration Steps

### Phase 1: Domain Transfer to Cloudflare -- DONE

Domain transferred from GoDaddy to Cloudflare Registrar. Nameservers point to Cloudflare. Zone settings and DNS are managed via OpenTofu in `infrastructure/cloudflare.tf`.

### Phase 2: API SSL -- Cloudflare Origin Certificate (replaces Let's Encrypt)

Do this when standing up the EC2 instance. Eliminates certbot entirely.

**All of this is now codified in OpenTofu** (`infrastructure/cloudflare.tf`):
- Origin CA cert is generated via `tls_private_key` + `tls_cert_request` + `cloudflare_origin_ca_certificate` resources
- Hostnames: `api.wheresreligion.org`, `api-staging.wheresreligion.org`
- 15-year validity, no renewal needed
- SSL mode set to `strict` via `cloudflare_zone_setting`
- API DNS records gated behind `create_api_dns` variable (set `true` when EC2 is deployed)
- EC2 security group restricts ports 80/443 to Cloudflare IPs only (`data.cloudflare_ip_ranges`)

**After `tofu apply`**, install the cert on EC2:
```bash
tofu output -raw origin_ca_certificate | sudo tee /etc/ssl/cloudflare/origin.pem
tofu output -raw origin_ca_private_key | sudo tee /etc/ssl/cloudflare/origin-key.pem
sudo chmod 600 /etc/ssl/cloudflare/origin-key.pem
sudo nginx -t && sudo systemctl reload nginx
```

The `user-data.sh` already configures Nginx to use these cert paths and listen on 443 with SSL. No certbot needed.

### Phase 3: Frontend -- Netlify to Cloudflare Workers

1. **Install dependencies**
   ```bash
   pnpm --filter web add @opennextjs/cloudflare@latest
   pnpm --filter web add -D wrangler@latest
   pnpm --filter web remove @netlify/plugin-nextjs  # if installed as dep
   ```

2. **Create `packages/web/wrangler.jsonc`**
   ```jsonc
   {
     "$schema": "node_modules/wrangler/config-schema.json",
     "main": ".open-next/worker.js",
     "name": "wheres-religion-web",
     "compatibility_date": "2025-05-05",
     "compatibility_flags": ["nodejs_compat", "global_fetch_strictly_public"],
     "assets": {
       "binding": "ASSETS",
       "directory": ".open-next/assets"
     }
   }
   ```

3. **Create `packages/web/open-next.config.ts`**
   ```typescript
   import { defineCloudflareConfig } from "@opennextjs/cloudflare";
   export default defineCloudflareConfig();
   ```

4. **Create `packages/web/.dev.vars`** (local dev env for Workers preview)
   ```
   NEXTJS_ENV=development
   ```

5. **Update `packages/web/package.json` scripts**
   ```json
   {
     "scripts": {
       "dev": "next dev",
       "build": "next build",
       "preview": "opennextjs-cloudflare build && opennextjs-cloudflare preview",
       "deploy": "opennextjs-cloudflare build && opennextjs-cloudflare deploy"
     }
   }
   ```

6. **Add `.open-next` to `packages/web/.gitignore`**

7. **Create `public/_headers`** for static asset cache control
   ```
   /_next/static/*
     Cache-Control: public, max-age=31536000, immutable
   ```

8. **Set environment variables in Cloudflare dashboard** (or `wrangler.jsonc` `[vars]`)
   - `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_MAP_KEY`
   - `NEXT_PUBLIC_MAP_ID`
   - `NEXT_PUBLIC_PLACES_KEY`
   - `NEXT_PUBLIC_S3_PROXY_PREFIX`
   - Any other `NEXT_PUBLIC_*` vars currently in Netlify

9. **Test locally**
   ```bash
   pnpm --filter web preview
   # Opens local Workers runtime -- verify pages load, auth works, maps render
   ```

10. **Deploy**
    ```bash
    pnpm --filter web deploy
    # Deploys to <worker-name>.workers.dev -- test there before switching DNS
    ```

11. **Add custom domain in Cloudflare Workers dashboard**
    - Workers & Pages > wheres-religion-web > Settings > Domains & Routes
    - Add `wheresreligion.org` and `www.wheresreligion.org`

12. **Remove Netlify**
    - Delete `netlify.toml` and `packages/web/netlify.toml`
    - Remove site from Netlify dashboard

### Phase 4: Update DNS Records

Final DNS state in Cloudflare:

| Type | Name | Value | Proxy |
|------|------|-------|-------|
| (Worker route) | `wheresreligion.org` | Worker: `wheres-religion-web` | -- |
| (Worker route) | `www.wheresreligion.org` | Worker: `wheres-religion-web` | -- |
| A | `api.wheresreligion.org` | `<EC2 Elastic IP>` | Proxied (orange) |
| A | `api-staging.wheresreligion.org` | `<EC2 Elastic IP>` | Proxied (orange) |

---

## Files to Create

| File | Purpose |
|------|---------|
| `packages/web/wrangler.jsonc` | Cloudflare Workers config |
| `packages/web/open-next.config.ts` | OpenNext adapter config |
| `packages/web/.dev.vars` | Local dev env for Workers preview |
| `packages/web/public/_headers` | Static asset cache headers |

## Files to Modify

| File | Change | Status |
|------|--------|--------|
| `packages/web/package.json` | Add `preview`/`deploy` scripts, add `@opennextjs/cloudflare` + `wrangler`, remove `sharp` + `@netlify/plugin-nextjs` | TODO |
| `packages/web/.gitignore` | Add `.open-next` | TODO |
| `infrastructure/cloudflare.tf` | Zone settings, Origin CA, DNS, rulesets | DONE |
| `infrastructure/versions.tf` | Add Cloudflare + TLS providers | DONE |
| `infrastructure/variables.tf` | Add `cloudflare_api_token`, `cloudflare_account_id`, `create_api_dns` | DONE |
| `infrastructure/main.tf` | Restrict security group to Cloudflare IPs | DONE |
| `infrastructure/scripts/user-data.sh` | Remove certbot, add Origin CA cert paths, SSL in Nginx | DONE |

## Files to Delete

| File | Reason |
|------|--------|
| `netlify.toml` (root) | Replaced by `wrangler.jsonc` |
| `packages/web/netlify.toml` | Replaced by `wrangler.jsonc` |

---

## Verification Checklist

### After Phase 1 (Domain Transfer) -- DONE
- [x] `dig wheresreligion.org NS` returns Cloudflare nameservers
- [x] Cloudflare dashboard shows the domain as Active

### After Phase 2 (API SSL)
- [ ] `curl https://api-staging.wheresreligion.org/api/health` returns 200
- [ ] SSL Labs test shows valid certificate chain
- [ ] EC2 is not directly accessible (if security group restricted to CF IPs)
- [ ] No certbot processes or crons on EC2

### After Phase 3 (Frontend Migration)
- [ ] `pnpm --filter web preview` serves the app locally in Workers runtime
- [ ] Auth flow works (login, session cookies)
- [ ] Google Maps loads and renders markers
- [ ] Note editor (Tiptap) loads and saves
- [ ] Media uploads work
- [ ] All pages render (home, map, stories, admin)
- [ ] `pnpm --filter web deploy` succeeds to `*.workers.dev`
- [ ] Custom domain `wheresreligion.org` serves from Workers

### After Phase 4 (DNS Cutover)
- [ ] `wheresreligion.org` serves the Workers-hosted frontend
- [ ] `www.wheresreligion.org` serves the Workers-hosted frontend
- [ ] `api.wheresreligion.org` proxies to EC2
- [ ] Mobile app "Visit Website" link still works
- [ ] Netlify site deleted
