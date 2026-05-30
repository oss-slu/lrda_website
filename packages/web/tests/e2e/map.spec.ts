import { test, expect, type Page } from '@playwright/test';
import { authedPage, TEST_USER_ID } from './helpers/pw';
import { seedTestData, resetTestData } from '../helpers/db-seed';

test.beforeAll(async () => {
  await seedTestData();
});

test.afterAll(async () => {
  await resetTestData();
});

async function navigateToMap(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('nav')).toBeVisible();
  await page.locator('nav a[href="/map"]').click();
  await page.waitForURL('**/map**');
}

async function waitForMapReady(page: Page): Promise<void> {
  await expect(page.getByText('Published Note')).toBeVisible({ timeout: 20_000 });
}

test.describe('Map page', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await authedPage(browser, TEST_USER_ID);
    await page.context().addCookies([
      { name: 'introShown', value: 'true', domain: 'localhost', path: '/' },
    ]);
    await navigateToMap(page);
    await waitForMapReady(page);
  });

  test.afterAll(async () => {
    await page?.context().close();
  });

  test('notes panel is open by default and shows published notes', async () => {
    await expect(page.getByText('Published Note')).toBeVisible();
  });

  test('panel toggle button closes and reopens the panel', async () => {
    const closeButton = page.getByRole('button', { name: /close notes panel/i });
    await closeButton.click();
    await expect(page.getByRole('button', { name: /open notes panel/i })).toBeVisible();

    await page.getByRole('button', { name: /open notes panel/i }).click();
    await expect(page.getByRole('button', { name: /close notes panel/i })).toBeVisible({
      timeout: 3_000,
    });
  });

  test('view toggle is visible for authenticated users', async () => {
    await expect(
      page.getByRole('button', { name: /show my notes|show all notes/i }),
    ).toBeVisible();
  });

  test('view toggle switches between global and personal views', async () => {
    const toggleButton = page.getByRole('button', { name: /show my notes/i });
    await toggleButton.click();
    await expect(page.getByRole('button', { name: /show all notes/i })).toBeVisible();

    await page.getByRole('button', { name: /show all notes/i }).click();
    await expect(page.getByRole('button', { name: /show my notes/i })).toBeVisible();
  });
});

test.describe('Map markers', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await authedPage(browser, TEST_USER_ID);
    await page.context().addCookies([
      { name: 'introShown', value: 'true', domain: 'localhost', path: '/' },
    ]);
    await navigateToMap(page);
    await waitForMapReady(page);

    // Search for the test note to pan the map to its location, then zoom in
    const input = page.getByRole('combobox');
    await input.fill('Published Note');
    await page.waitForTimeout(500);
    // Click the note result (has StickyNote icon with text-primary class),
    // not the typed-location suggestion (has MapPin icon)
    const noteResult = page
      .locator('#map-search-listbox button')
      .filter({ hasText: 'Published Note' })
      .filter({ has: page.locator('.text-primary') })
      .first();
    await noteResult.click();
    await page.waitForTimeout(500);

    // Zoom in to break clusters
    const zoomIn = page.getByRole('button', { name: 'Zoom in' });
    for (let i = 0; i < 5; i++) {
      await zoomIn.click();
      await page.waitForTimeout(300);
    }

    // Wait for individual markers to have non-zero bounding boxes in the viewport
    await page.waitForFunction(
      () => {
        for (const m of document.querySelectorAll('.custom-marker')) {
          const rect = m.getBoundingClientRect();
          if (
            rect.width > 0 &&
            rect.height > 0 &&
            rect.x >= 0 &&
            rect.y >= 0 &&
            rect.x < window.innerWidth &&
            rect.y < window.innerHeight
          )
            return true;
        }
        return false;
      },
      { timeout: 10_000 },
    );
  });

  test.afterAll(async () => {
    await page?.context().close();
  });

  test('individual markers are visible after zooming in', async () => {
    const visibleCount = await page.evaluate(() => {
      let count = 0;
      for (const m of document.querySelectorAll('.custom-marker')) {
        const rect = m.getBoundingClientRect();
        if (
          rect.width > 0 &&
          rect.height > 0 &&
          rect.x >= 0 &&
          rect.y >= 0 &&
          rect.x < window.innerWidth &&
          rect.y < window.innerHeight
        )
          count++;
      }
      return count;
    });
    expect(visibleCount).toBeGreaterThanOrEqual(1);
  });

  test('hovering a marker shows a popup', async () => {
    // Find a visible marker's wrapper element (marker.element) and hover it
    const hovered = await page.evaluate(() => {
      for (const m of document.querySelectorAll('.custom-marker')) {
        const wrapper = m.parentElement;
        if (!wrapper) continue;
        const rect = wrapper.getBoundingClientRect();
        if (
          rect.width > 0 &&
          rect.height > 0 &&
          rect.x >= 0 &&
          rect.y >= 0 &&
          rect.x < window.innerWidth &&
          rect.y < window.innerHeight
        ) {
          wrapper.dispatchEvent(new PointerEvent('pointerenter', { bubbles: false }));
          return true;
        }
      }
      return false;
    });
    expect(hovered).toBe(true);

    const popup = page.locator('.popup-bubble');
    await expect(popup).toBeVisible({ timeout: 5_000 });
  });

  test('popup closes when mouse leaves', async () => {
    await page.mouse.move(0, 0);
    const popup = page.locator('.popup-bubble');
    await expect(popup).toBeHidden({ timeout: 3_000 });
  });
});

test.describe('Map search combobox', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    await context.addCookies([
      { name: 'introShown', value: 'true', domain: 'localhost', path: '/' },
    ]);
    page = await context.newPage();
    await navigateToMap(page);
    await waitForMapReady(page);
  });

  test.afterAll(async () => {
    await page?.context().close();
  });

  test('search input has combobox role and aria attributes', async () => {
    const input = page.getByRole('combobox');
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute('aria-expanded', 'false');
    await expect(input).toHaveAttribute('aria-autocomplete', 'list');
  });

  test('typing opens dropdown and sets aria-expanded', async () => {
    const input = page.getByRole('combobox');
    await input.fill('test');
    await expect(input).toHaveAttribute('aria-expanded', 'true', { timeout: 3_000 });

    const listbox = page.locator('#map-search-listbox');
    await expect(listbox).toBeVisible();
  });

  test('arrow keys navigate options and update aria-activedescendant', async () => {
    const input = page.getByRole('combobox');
    await input.fill('test');
    await expect(page.locator('#map-search-listbox')).toBeVisible({ timeout: 3_000 });

    await input.press('ArrowDown');
    const activeId = await input.getAttribute('aria-activedescendant');
    expect(activeId).toBe('map-search-option-0');

    const firstOption = page.locator(`#${activeId}`);
    await expect(firstOption).toHaveAttribute('aria-selected', 'true');

    await input.press('ArrowDown');
    const nextId = await input.getAttribute('aria-activedescendant');
    expect(nextId).toBe('map-search-option-1');
  });

  test('escape closes dropdown', async () => {
    const input = page.getByRole('combobox');
    await input.press('Escape');
    await expect(input).toHaveAttribute('aria-expanded', 'false');
  });
});
