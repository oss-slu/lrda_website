import { test, expect, type Page } from '@playwright/test';
import { authedPage, TEST_USER_ID } from './helpers/pw';
import { seedTestData, resetTestData, execute } from '../helpers/db-seed';

const TITLE = `e2e editor note ${Date.now()}`;
const EDITED_TITLE = `${TITLE} (edited)`;
const METADATA_TITLE = `e2e metadata note ${Date.now()}`;
const TAG_NAME = 'testtag';

test.beforeAll(async () => {
  await seedTestData();
});

test.afterAll(async () => {
  await resetTestData();
  await execute(`DELETE FROM note WHERE creator_id = $1 AND title IN ($2, $3, $4)`, TEST_USER_ID, TITLE, EDITED_TITLE, METADATA_TITLE);
});

// Direct page.goto() to /notes hangs the dev SSR pass; navigate client-side.
async function openNotes(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.locator('nav a[href="/notes"]').click();
  await page.waitForURL('**/notes**');
}

async function dismissTourIfVisible(page: Page): Promise<void> {
  const skip = page.getByText('Skip', { exact: true });
  try {
    await skip.click({ timeout: 2000 });
  } catch {
    // Tour not showing, nothing to dismiss
  }
}

// Autosave is debounced -> a PATCH to /api/notes/<id>.
function waitForAutosave(page: Page) {
  return page.waitForResponse(
    r => /\/api\/notes\//.test(r.url()) && r.request().method() === 'PATCH' && r.ok(),
  );
}

test.describe('Notes - create & edit (UI)', () => {
  test('create a note, edit its title, and the change persists', async ({ browser }) => {
    const page = await authedPage(browser, TEST_USER_ID);
    await openNotes(page);

    // Create: clicking add creates the note and opens it in the editor
    await page.getByTestId('add-note-button').click();
    const titleInput = page.locator('#note-title-input');
    await expect(titleInput).toBeVisible();

    // Fill the title + body, wait for autosave to persist
    await titleInput.fill(TITLE);
    await page.locator('.ProseMirror').click();
    await page.keyboard.type('Hello from the e2e editor test.');
    await waitForAutosave(page);

    // Reload -> the persisted note shows in the sidebar list
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(TITLE, { exact: false })).toBeVisible();

    // Edit: reopen it, change the title, wait for autosave
    await page.getByText(TITLE, { exact: false }).first().click();
    await expect(titleInput).toHaveValue(TITLE);
    await titleInput.fill(EDITED_TITLE);
    await waitForAutosave(page);

    // Reload -> the edited title persisted
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(EDITED_TITLE, { exact: false })).toBeVisible();

    await page.context().close();
  });
});

test.describe('Notes - tags & date picker (UI)', () => {
  test('add a tag, remove it, change the date, and all changes persist', async ({ browser }) => {
    const page = await authedPage(browser, TEST_USER_ID);
    await openNotes(page);

    // Create a fresh note
    await page.getByTestId('add-note-button').click();
    const titleInput = page.locator('#note-title-input');
    await expect(titleInput).toBeVisible();

    // Start listening before the action that triggers autosave
    let autosaved = waitForAutosave(page);
    await titleInput.fill(METADATA_TITLE);
    await autosaved;

    // -- Add a tag --
    await page.getByText('Add tag').click();
    const tagInput = page.locator('input[placeholder="Type tag..."]');
    await expect(tagInput).toBeVisible();
    await tagInput.fill(TAG_NAME);

    autosaved = waitForAutosave(page);
    await tagInput.press('Enter');

    // Tag pill should appear
    await expect(page.locator(`span:has-text("${TAG_NAME}")`).first()).toBeVisible();
    await autosaved;

    // Reload and reopen the note to verify tag persisted
    await page.reload();
    await page.waitForLoadState('networkidle');
    await dismissTourIfVisible(page);
    await page.getByText(METADATA_TITLE, { exact: false }).first().click();
    await expect(page.locator(`span:has-text("${TAG_NAME}")`).first()).toBeVisible();

    // -- Remove the tag --
    // The X button is inside the tag pill span
    const tagPill = page.locator(`span:has-text("${TAG_NAME}")`).first();
    autosaved = waitForAutosave(page);
    await tagPill.locator('button').click();

    // Tag should be gone
    await expect(page.locator(`span:has-text("${TAG_NAME}")`)).not.toBeVisible();
    await autosaved;

    // Reload and verify removal persisted
    await page.reload();
    await page.waitForLoadState('networkidle');
    await dismissTourIfVisible(page);
    await page.getByText(METADATA_TITLE, { exact: false }).first().click();
    await expect(page.locator(`span:has-text("${TAG_NAME}")`)).not.toBeVisible();

    // -- Change the date --
    const calendarButton = page.locator('button[aria-label="Open Calendar"]');
    const initialDateText = await calendarButton.textContent();

    await calendarButton.click();

    // Wait for the calendar popover to appear, then click day 15
    await expect(page.locator('[data-day]').first()).toBeVisible();

    autosaved = waitForAutosave(page);
    await page.getByRole('button', { name: /May 15/ }).click();

    // The button text should have changed
    const updatedDateText = await calendarButton.textContent();
    expect(updatedDateText).not.toBe(initialDateText);
    await autosaved;

    // Reload and verify the date persisted
    await page.reload();
    await page.waitForLoadState('networkidle');
    await dismissTourIfVisible(page);
    await page.getByText(METADATA_TITLE, { exact: false }).first().click();
    const persistedDateText = await page.locator('button[aria-label="Open Calendar"]').textContent();
    expect(persistedDateText).toBe(updatedDateText);

    await page.context().close();
  });
});
