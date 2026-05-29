import { test, expect, type Page } from '@playwright/test';
import { authedPage, TEST_USER_ID } from './helpers/pw';
import { seedTestData, resetTestData, execute } from '../../tests/e2e/helpers/db-seed';

const TITLE = `e2e editor note ${Date.now()}`;
const EDITED_TITLE = `${TITLE} (edited)`;

test.beforeAll(async () => {
  await seedTestData();
});

test.afterAll(async () => {
  await resetTestData();
  await execute(`DELETE FROM note WHERE creator_id = $1 AND title IN ($2, $3)`, TEST_USER_ID, TITLE, EDITED_TITLE);
});

// Direct page.goto() to /notes hangs the dev SSR pass; navigate client-side.
async function openNotes(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.locator('nav a[href="/notes"]').click();
  await page.waitForURL('**/notes**');
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
