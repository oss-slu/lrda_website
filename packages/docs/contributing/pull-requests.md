# Pull Requests

Guidelines for submitting pull requests to the project.

## Before Submitting

1. **Run linting**: `pnpm lint` -- fix any issues
2. **Run tests**: `pnpm test` -- ensure all tests pass
3. **Test locally**: Verify your changes work in the browser
4. **Update documentation**: If your changes affect user-facing behavior or developer setup

## PR Process

1. Push your feature branch to your fork
2. Open a pull request against `main` on the upstream repository
3. Fill in the PR template with a description of your changes
4. Link any related issues (e.g., "Closes #123")
5. Wait for CI checks to pass
6. Request review from a maintainer

## Commit Messages

- Write clear, concise commit messages
- Use imperative mood ("add feature" not "added feature")
- No emojis in commit messages
- Reference issue numbers where applicable

## CI Checks

Pull requests trigger the CI pipeline which runs:
- ESLint linting
- TypeScript type checking
- Unit tests (Vitest)
- E2E tests (Playwright)

All checks must pass before a PR can be merged.

## Review Process

- Maintainers will review your code for correctness, style, and architecture
- Address review feedback by pushing new commits to your branch
- Once approved, a maintainer will merge your PR
