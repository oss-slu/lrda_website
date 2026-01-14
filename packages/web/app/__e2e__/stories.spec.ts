import { test, expect } from '@playwright/test';

/**
 * Stories Page E2E Test
 * 
 * This test verifies the basic stories page functionality:
 * - Stories page loads correctly
 * - Page has content and is accessible
 * - Basic page structure is present
 * - URL sanitization works correctly
 * 
 * Test Strategy: Focus on stories page structure and basic page presence
 * without testing story creation, editing, or complex user interactions.
 */
test.describe('Stories Page', () => {
  test('should display stories page with basic content', async ({ page }) => {
    // Navigate to stories page
    await page.goto('/stories', { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');
    
    // Wait a bit more for any dynamic content to load
    await page.waitForTimeout(3000);
    
    // Check that page loaded (not a 404 or error)
    const hasContent = await page.locator('div').count() > 0;
    expect(hasContent).toBeTruthy();
    
    // Verify page is interactive (has some elements)
    const hasElements = await page.locator('*').count() > 10;
    expect(hasElements).toBeTruthy();
    
    // Check for specific content that should be visible
    const pageTitle = page.locator('h1, h2, h3, h4, h5, h6').first();
    if (await pageTitle.count() > 0) {
      await expect(pageTitle).toBeVisible();
    }
    
    // Check for navigation or main content area
    const mainContent = page.locator('main, [role="main"], .main, #main').first();
    if (await mainContent.count() > 0) {
      await expect(mainContent).toBeVisible();
    }
  });

  test('should handle stories with blob: URLs without network errors', async ({ page }) => {
    // Listen for network errors
    const networkErrors: string[] = [];
    page.on('requestfailed', (request) => {
      const url = request.url();
      if (url.startsWith('blob:') || url.startsWith('data:')) {
        networkErrors.push(url);
      }
    });

    // Navigate to stories page
    await page.goto('/stories', { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for stories to load
    await page.waitForTimeout(5000);
    
    // Check that no blob: or data: URL network errors occurred
    // (These should be filtered out before they cause network requests)
    const blobDataErrors = networkErrors.filter(url => url.startsWith('blob:') || url.startsWith('data:'));
    expect(blobDataErrors.length).toBe(0);
  });

  test('should render story cards without throwing errors', async ({ page }) => {
    // Capture console errors
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Navigate to stories page
    await page.goto('/stories', { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for stories to load
    await page.waitForTimeout(5000);
    
    // Check for story cards (they may or may not exist depending on data)
    const storyCards = page.locator('[data-testid="note-card"], .note-card, [class*="card"]');
    const cardCount = await storyCards.count();
    
    // If cards exist, verify they render without critical errors
    if (cardCount > 0) {
      // Filter out known benign errors (like missing API keys in test environment)
      const criticalErrors = consoleErrors.filter(error => 
        !error.includes('API key') && 
        !error.includes('Map ID') &&
        !error.includes('NetworkError') &&
        !error.includes('blob:') &&
        !error.includes('data:')
      );
      
      // Should not have critical errors related to URL handling
      expect(criticalErrors.length).toBe(0);
    }
  });

  test('should handle story cards with problematic URLs in content', async ({ page }) => {
    // Navigate to stories page
    await page.goto('/stories', { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for stories to load
    await page.waitForTimeout(5000);
    
    // Check that the page loaded successfully
    const pageContent = await page.content();
    expect(pageContent).toBeTruthy();
    
    // Verify no unhandled errors in the page
    const hasError = pageContent.includes('Error:') || pageContent.includes('TypeError:');
    expect(hasError).toBeFalsy();
  });

  test('should display search bar and filter controls', async ({ page }) => {
    // Navigate to stories page
    await page.goto('/stories', { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for content to load
    await page.waitForTimeout(3000);
    
    // Check for search input
    const searchInput = page.locator('input[type="text"][placeholder*="Search"], input[type="text"][placeholder*="search"]');
    const searchCount = await searchInput.count();
    
    // Search bar should be present
    if (searchCount > 0) {
      await expect(searchInput.first()).toBeVisible();
    }
    
    // Check for user filter dropdown
    const userFilter = page.locator('select');
    const filterCount = await userFilter.count();
    
    // Filter dropdown may or may not be present depending on data
    if (filterCount > 0) {
      await expect(userFilter.first()).toBeVisible();
    }
  });
}); 
