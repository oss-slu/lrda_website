# Getting Started

Thank you for your interest in contributing to Where's Religion?! This project is built by students at Saint Louis University as part of the Open Source with SLU initiative.

## Before You Start

1. Read the [Code of Conduct](https://github.com/oss-slu/lrda_website/blob/main/CODE_OF_CONDUCT.md)
2. Check the [open issues](https://github.com/oss-slu/lrda_website/issues) for something to work on
3. If you want to work on something new, open an issue first to discuss it

## Fork and Clone

1. **Fork** the repository to your own GitHub account
2. **Clone** your fork:

```bash
git clone https://github.com/YOUR_USERNAME/lrda_website.git
cd lrda_website
```

3. **Install dependencies**:

```bash
pnpm install
```

4. **Set up environment variables**:

```bash
pnpm setup
```

5. **Start the dev server**:

```bash
pnpm dev
```

See the [Quick Start](/guide/quick-start) for detailed setup instructions, including database migrations and API keys.

## Development Workflow

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and test them locally

3. Run linting and tests:
   ```bash
   pnpm lint
   pnpm test
   ```

4. Commit your changes and push to your fork

5. Open a pull request against `main` -- see [Pull Requests](/contributing/pull-requests)

## Getting Help

- Check the [Architecture docs](/architecture/overview) to understand the codebase
- Look at existing code for patterns to follow
- Open an issue or discussion if you're stuck
