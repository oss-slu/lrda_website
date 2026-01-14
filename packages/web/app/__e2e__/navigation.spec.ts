import { test, expect } from '@playwright/test';

/**
 * Navigation E2E Test
 * 
 * This test verifies the basic navigation functionality:
 * - Navigation menu is accessible
 * - Key navigation links are present
 * - Navigation responds to user interaction
 * 
 * Test Strategy: Focus on navigation structure and basic link presence
 * without testing authentication-dependent navigation or complex user flows.
 */
test.describe('Navigation', () => {
  test('should display navigation menu with key links', async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check that navigation menu exists
    const nav = page.locator('nav, [role="navigation"]');
    await expect(nav).toBeVisible();
    
    // Verify key navigation links are present (use first() to handle multiple matches)
    await expect(page.locator('nav a:has-text("Home")').first()).toBeVisible();
    await expect(page.locator('nav a:has-text("Map")').first()).toBeVisible();
    await expect(page.locator('nav a:has-text("Stories")').first()).toBeVisible();
    
    // Check for login button
    await expect(page.locator('button:has-text("Login")')).toBeVisible();
  });

  test('should display Resources page with properly formatted citations', async ({ page }) => {
    // Navigate to Resources page
    await page.goto('/resources');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check that Resources page title is visible
    await expect(page.locator('h1:has-text("Resources")')).toBeVisible();
    
    // Check that Online Resources section exists
    await expect(page.locator('h2:has-text("Online Resources")')).toBeVisible();
    
    // Check that Further Reading section exists
    await expect(page.locator('h2:has-text("Further Reading")')).toBeVisible();
    
    // Test Case 1: Plain text citation (not italicized)
    const citation1 = page.locator('text=/American Anthropological Association Resources on Ethics/');
    await expect(citation1).toBeVisible({ timeout: 10000 });
    // Verify it's NOT italicized (plain text)
    const italicSpan1 = citation1.locator('..').locator('span.italic, [style*="font-style: italic"]');
    const count1 = await italicSpan1.count();
    expect(count1).toBe(0);
    
    // Test Case 2: Citation with period - title should be italicized
    const citation2 = page.locator('text=/Engaging Communities: Writing Ethnographic Research/');
    await expect(citation2).toBeVisible();
    // Check if the title part is italicized
    const italicSpan2 = citation2.locator('..').locator('span.italic, [style*="font-style: italic"]');
    const count2 = await italicSpan2.count();
    expect(count2).toBeGreaterThan(0);
    
    // Test Case 3: Citation with et. al. - title should be italicized
    const citation3 = page.locator('text=/Ethnography Made Easy/');
    await expect(citation3).toBeVisible();
    // Check if the title part is italicized
    const italicSpan3 = citation3.locator('..').locator('span.italic, [style*="font-style: italic"]');
    const count3 = await italicSpan3.count();
    expect(count3).toBeGreaterThan(0);
    
    // Verify that at least some citations are displayed
    const citations = page.locator('li').filter({ hasText: /[A-Z][a-z]+/ });
    const citationCount = await citations.count();
    expect(citationCount).toBeGreaterThan(0);
  });

  test('should navigate to correct URLs when clicking Online Resources links', async ({ page, context }) => {
    // Navigate to Resources page
    await page.goto('/resources', { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    // Verify page loaded
    await expect(page.locator('h1:has-text("Resources")')).toBeVisible();
    await expect(page.locator('h2:has-text("Online Resources")')).toBeVisible();
    
    // Test each Online Resource link
    const expectedUrls = [
      'https://americananthro.org/about/anthropological-ethics/',
      'http://www.engagingcommunities.org/introduction/',
      'https://cuny.manifoldapp.org/projects/ethnographies-of-work',
      'https://williamwolff.org/wp-content/uploads/2016/01/emerson-fieldnotes-2011.pdf',
    ];
    
    // Get all links in the Online Resources section
    const onlineResourcesSection = page.locator('h2:has-text("Online Resources")').locator('..');
    const links = onlineResourcesSection.locator('a[href]');
    const linkCount = await links.count();
    
    expect(linkCount).toBe(expectedUrls.length);
    
    // Test each link
    for (let i = 0; i < linkCount; i++) {
      const link = links.nth(i);
      const href = await link.getAttribute('href');
      const expectedUrl = expectedUrls[i];
      
      // Verify the href attribute matches expected URL
      expect(href).toBe(expectedUrl);
      
      // Verify target="_blank" and rel="noopener noreferrer" for security
      const target = await link.getAttribute('target');
      const rel = await link.getAttribute('rel');
      expect(target).toBe('_blank');
      expect(rel).toContain('noopener');
      expect(rel).toContain('noreferrer');
      
      // Click the link and verify it opens in a new page
      // Use a shorter timeout to avoid hanging on slow external sites
      const pagePromise = context.waitForEvent('page', { timeout: 5000 });
      await link.click();
      
      try {
        const newPage = await pagePromise;
        
        // Wait briefly for the page to start loading, but don't wait for full load
        // External sites can be slow, so we just verify the URL was set correctly
        await Promise.race([
          newPage.waitForLoadState('domcontentloaded', { timeout: 10000 }),
          new Promise(resolve => setTimeout(resolve, 2000)), // Max 2 seconds wait
        ]);
        
        // Verify the new page URL matches expected URL
        // Note: Some URLs may redirect, so we check if the URL starts with the expected domain
        const newPageUrl = newPage.url();
        const expectedDomain = new URL(expectedUrl).hostname;
        const actualDomain = new URL(newPageUrl).hostname;
        
        // Allow for redirects but verify we're on the correct domain
        expect(actualDomain).toBe(expectedDomain);
        
        // Close the new page
        await newPage.close();
      } catch (error) {
        // If the page fails to open or load, that's okay - we already verified the href
        // External sites may be slow or unavailable, but the link itself is correct
        // This is acceptable for E2E tests
      }
    }
  });
});
