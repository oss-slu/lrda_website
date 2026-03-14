import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import type { Page } from 'playwright';
import { newPage, url } from './helpers/pw';

describe('Stories Page', () => {
  let page: Page;

  beforeAll(async () => {
    page = await newPage();
  });

  afterAll(async () => {
    await page.context().close();
  });

  test('displays search bar and filter controls', async () => {
    await page.goto(url('/stories'));

    await page.getByPlaceholder('Search stories...').waitFor({ state: 'visible' });

    // At least one dropdown trigger should be present (sort order)
    const selectTriggers = page.locator('button[role="combobox"]');
    expect(await selectTriggers.count()).toBeGreaterThan(0);
  });
});
