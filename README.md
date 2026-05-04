# The Where's Religion? Web Application

**Product Owner:** [Adam Park](https://github.com/park353) | Part of the [Where's Religion](https://wheresreligion.org) project, funded by the Henry Luce Foundation and developed through [Open Source with SLU](https://github.com/oss-slu).

Where's Religion? is a collaborative platform designed for diverse users with interests in sharing media and notes about their respective encounters with "religion" in everyday places.


Find the mobile app repository [here](https://github.com/oss-slu/lrda_mobile)


## Getting Started


```bash
# Clone and install
git clone https://github.com/oss-slu/lrda_website.git
cd lrda_website
pnpm install


# Set up environment files
pnpm setup

# Start everything (API + frontend)
pnpm dev
```


Open [http://localhost:3000](http://localhost:3000) - the full stack is running!


> **New Contributors:** See our detailed [Contributing Guide](CONTRIBUTING.md) for more options and troubleshooting.


## Project Structure

This is a monorepo with the following packages:

- `packages/api/` - Hono REST API (Node.js + PostgreSQL) on AWS Lightsail
- `packages/web/` - TanStack Start application on Cloudflare Workers
