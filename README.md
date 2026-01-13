# The Where's Religion? Web Application

Where's Religion? is a colaborative platform designed for diverse users with interests in sharing media and notes about their respective encounters with "religion" in everyday places.

Find the mobile app repository [here](https://github.com/oss-slu/lrda_mobile)

## Getting Started

```bash
# Clone and install
git clone https://github.com/oss-slu/lrda_website.git
cd lrda_website
pnpm install

# Set up environment files
pnpm setup

# Start everything (Docker, Firebase emulators, backend, frontend)
pnpm dev:full
```

Open [http://localhost:3000](http://localhost:3000) - the full stack is running!

> **New Contributors:** See our detailed [Contributing Guide](CONTRIBUTING.md) for more options and troubleshooting.

## Project Structure

This is a monorepo with the following packages:

- `packages/web/` - Next.js web application
- `packages/server/` - Express.js REST API server (located at `server/` root)
- `packages/lrda-server-core/` - RERUM framework-based server core library

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
