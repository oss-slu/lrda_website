import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import type { Page } from 'playwright';
import { newPage, url } from './helpers/pw';

describe('Notes Page', () => {
  let page: Page;

  beforeAll(async () => {
    page = await newPage();
  });

  afterAll(async () => {
    await page.context().close();
  });

  test('redirects unauthenticated users to login', async () => {
    await page.goto(url('/notes'));
    await page.waitForURL(/\/login/);
    // waitForURL already asserts the URL matches; no redundant expect needed
  });
});
