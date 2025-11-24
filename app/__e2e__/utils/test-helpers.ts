/**
 * Test Helper Functions for Playwright E2E Tests
 * 
 * This file contains minimal, reusable helper functions for common test operations.
 * Keep these functions simple and focused to maintain test reliability.
 */

import { Page, expect } from '@playwright/test';

/**
 * Wait for page to be fully loaded and ready
 */
export async function waitForPageReady(page: Page): Promise<void> {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
}

/**
 * Check if element exists and is visible
 */
export async function assertElementVisible(page: Page, selector: string): Promise<void> {
  await expect(page.locator(selector)).toBeVisible();
}

/**
 * Check if text content exists on page
 */
export async function assertTextExists(page: Page, text: string): Promise<void> {
  await expect(page.locator(`text=${text}`)).toBeVisible();
}

/**
 * Navigate to a page and wait for it to load
 */
export async function navigateToPage(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await waitForPageReady(page);
}

/**
 * Simple form fill helper
 */
export async function fillFormField(page: Page, selector: string, value: string): Promise<void> {
  await page.locator(selector).fill(value);
}

/**
 * Click button and wait for action to complete
 */
export async function clickAndWait(page: Page, selector: string): Promise<void> {
  await page.locator(selector).click();
  await page.waitForTimeout(500); // Simple wait for any async operations
}
