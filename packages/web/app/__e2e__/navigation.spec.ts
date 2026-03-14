import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import type { Page } from 'playwright';
import { newPage, url } from './helpers/pw';

describe('Navigation', () => {
  let page: Page;

  beforeAll(async () => {
    page = await newPage();
  });

  afterAll(async () => {
    await page.context().close();
  });

  test('home page displays heading, navigation, and login link', async () => {
    await page.goto(url('/'));
    await page.waitForLoadState('networkidle');

    expect(await page.locator('h1').textContent()).toContain("Where's Religion?");
    await page.locator('nav').waitFor({ state: 'visible' });
    await page.locator('nav a:has-text("Home")').first().waitFor({ state: 'visible' });
    await page.locator('nav a:has-text("Map")').first().waitFor({ state: 'visible' });
    await page.locator('nav a:has-text("Stories")').first().waitFor({ state: 'visible' });
    await page.getByRole('link', { name: 'Login' }).waitFor({ state: 'visible' });
  });

  test('resources page displays citations with proper formatting', async () => {
    await page.goto(url('/resources'));
    await page.waitForLoadState('networkidle');

    await page.locator('h1:has-text("Resources")').waitFor({ state: 'visible' });
    await page.locator('h2:has-text("Online Resources")').waitFor({ state: 'visible' });
    await page.locator('h2:has-text("Further Reading")').waitFor({ state: 'visible' });

    // Verify citation with italicized title using a stable selector
    const italicSpan = page.locator('span.italic, [style*="font-style: italic"]', {
      hasText: 'Engaging Communities: Writing Ethnographic Research',
    });
    expect(await italicSpan.count()).toBeGreaterThan(0);

    // Verify at least some citations are displayed
    const citations = page.locator('li').filter({ hasText: /[A-Z][a-z]+/ });
    expect(await citations.count()).toBeGreaterThan(0);
  });

  test('resources page links have correct URLs and security attributes', async () => {
    await page.goto(url('/resources'));
    await page.waitForLoadState('networkidle');

    const onlineResourcesSection = page.locator('section').filter({
      has: page.locator('h2:has-text("Online Resources")'),
    });
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
