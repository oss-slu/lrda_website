# Playwright E2E Test Setup Guide

## Prerequisites
- Node.js 16+ and pnpm
- Your LRDA website application running locally

## Step-by-Step Setup

### 1. Install Playwright Dependencies
```bash
# Install Playwright browsers and dependencies
pnpm exec playwright install
```

### 2. Verify Configuration
The following files should now exist:
- `playwright.config.ts` - Main configuration
- `app/__e2e__/` - Test directory
- `package.json` - Updated with test scripts

### 3. Start Your Application
```bash
# Start your development server
pnpm dev
```

### 4. Run Your First Test
```bash
# Run all E2E tests
pnpm test:e2e

# Run specific test file
pnpm exec playwright test home.spec.ts

# Run tests with UI (interactive)
pnpm test:e2e:ui
```

## Test Structure

### Current Test Files
- `home.spec.ts` - Home page functionality
- `navigation.spec.ts` - Navigation menu
- `login.spec.ts` - Login page
- `map.spec.ts` - Map page
- `notes.spec.ts` - Notes page
- `stories.spec.ts` - Stories page

### Test Philosophy
- **1 test per file** for easy maintenance
- **Minimal complexity** to ensure reliability
- **Focused testing** on core functionality
- **No authentication dependencies** for basic tests

## Customization

### Adding New Tests
1. Create new `.spec.ts` file in `app/__e2e__/`
2. Follow the existing pattern: 1 test per file
3. Use descriptive test names
4. Add comprehensive comments

### Modifying Selectors
If tests fail due to selector issues:
1. Inspect your actual HTML structure
2. Update selectors in the test files
3. Use more reliable selectors (data-testid, text content)
4. Test locally before committing

## Troubleshooting

### Common Issues
1. **"Cannot find module '@playwright/test'"**
   - Run: `pnpm exec playwright install`

2. **Tests fail with element not found**
   - Check your HTML structure
   - Update selectors in test files
   - Use browser dev tools to verify elements

3. **Application not running**
   - Ensure `pnpm dev` is running
   - Check if app is accessible at `http://localhost:3000`

### Debug Mode
```bash
# Run tests with debug logging
pnpm test:e2e:debug

# Run with headed mode to see browser
pnpm test:e2e:headed
```

## Next Steps

### For Basic Testing
- Run existing tests to verify they work
- Customize selectors based on your HTML
- Add more specific test cases as needed

### For Advanced Testing
- Add authentication tests
- Test complex user workflows
- Add performance testing
- Integrate with CI/CD pipeline

## Support
- [Playwright Documentation](https://playwright.dev/)
- [Playwright Test API](https://playwright.dev/docs/api/class-test)
- [Best Practices](https://playwright.dev/docs/best-practices)
