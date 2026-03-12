import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('home page displays heading, navigation, and login link', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1')).toContainText("Where's Religion?");
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('nav a:has-text("Home")').first()).toBeVisible();
    await expect(page.locator('nav a:has-text("Map")').first()).toBeVisible();
    await expect(page.locator('nav a:has-text("Stories")').first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
  });

  test('resources page displays citations with proper formatting', async ({ page }) => {
    await page.goto('/resources');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1:has-text("Resources")')).toBeVisible();
    await expect(page.locator('h2:has-text("Online Resources")')).toBeVisible();
    await expect(page.locator('h2:has-text("Further Reading")')).toBeVisible();

    // Verify citation with italicized title
    const citation = page.locator('text=/Engaging Communities: Writing Ethnographic Research/');
    await expect(citation).toBeVisible();
    const italicSpan = citation
      .locator('..')
      .locator('span.italic, [style*="font-style: italic"]');
    expect(await italicSpan.count()).toBeGreaterThan(0);

    // Verify at least some citations are displayed
    const citations = page.locator('li').filter({ hasText: /[A-Z][a-z]+/ });
    expect(await citations.count()).toBeGreaterThan(0);
  });

  test('resources page links have correct URLs and security attributes', async ({ page }) => {
    await page.goto('/resources');
    await page.waitForLoadState('networkidle');

    const onlineResourcesSection = page.locator('h2:has-text("Online Resources")').locator('..');
    const links = onlineResourcesSection.locator('a[href]');
    const linkCount = await links.count();
    expect(linkCount).toBeGreaterThan(0);

    for (let i = 0; i < linkCount; i++) {
      const link = links.nth(i);
      const href = await link.getAttribute('href');
      expect(href).toMatch(/^https?:\/\//);

      const target = await link.getAttribute('target');
      const rel = await link.getAttribute('rel');
      expect(target).toBe('_blank');
      expect(rel).toContain('noopener');
      expect(rel).toContain('noreferrer');
    }
  });
});
