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

- `packages/api/` - Hono REST API on Cloudflare Workers (D1 database)
- `packages/web/` - Next.js web application on Cloudflare Workers (via OpenNext)

## We Are Using

[Tiptap](https://tiptap.dev/) : A headless rich text editor framework, see [Tiptap Documentation](https://tiptap.dev/docs/).

[mui-tiptap](https://www.npmjs.com/package/mui-tiptap): A customizable Material UI styled WYSIWYG rich text editor, using Tiptap.

[shadcn](https://ui.shadcn.com/) : A beautifully designed UI Component Library.

## Learn More

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).
To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!
