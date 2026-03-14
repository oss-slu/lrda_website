import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import type { Page } from 'playwright';
import { newPage, url } from './helpers/pw';

describe('Map Page', () => {
  let page: Page;

  beforeAll(async () => {
    page = await newPage();
  });

  afterAll(async () => {
    await page.context().close();
  });

  test('displays search bar and map controls', async () => {
    await page.goto(url('/map'));

    await page.getByPlaceholder('Search notes...').waitFor({ state: 'visible' });

    const zoomIn = page.locator('button[title="Zoom in"]');
    const zoomOut = page.locator('button[title="Zoom out"]');
    const findLocation = page.locator('button[title="Find my location"]');

    await zoomIn.waitFor({ state: 'visible' });
    await zoomOut.waitFor({ state: 'visible' });
    await findLocation.waitFor({ state: 'visible' });

    expect(await zoomIn.isVisible()).toBe(true);
    expect(await zoomOut.isVisible()).toBe(true);
    expect(await findLocation.isVisible()).toBe(true);
  });
});
