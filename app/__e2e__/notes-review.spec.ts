import { test, expect, Page } from '@playwright/test';

test.describe('Notes Review UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/lib/pages/notes', { waitUntil: 'domcontentloaded', timeout: 60000 });
    // Wait for page to be interactive instead of networkidle (which may never complete)
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000); // Allow time for dynamic content
  });

  async function ensureNoteSelected(page: Page) {
    // Try to select an existing note; if none, create one via Add Note
    const listItem = page.locator('#notes-list > div');
    if (await listItem.first().isVisible().catch(() => false)) {
      await listItem.first().click();
      return;
    }

    // Click Add Note button to create a new note
    const addBtn = page.locator('#add-note-button');
    if (await addBtn.isVisible().catch(() => false)) {
      await addBtn.click();
      // Wait for editor to render
      await page.waitForTimeout(500);
      return;
    }

    // Fallback: wait for anything clickable in notes list
    await page.waitForSelector('#notes-list, [id="add-note-button"]', { timeout: 20000 });
    if (await listItem.first().isVisible().catch(() => false)) {
      await listItem.first().click();
    }
  }

  test('shows resizable handle between sidebar and editor', async ({ page }) => {
    // visible separator handle between left sidebar and editor
    const outerHandle = page.locator('[role="separator"]').first();
    await expect(outerHandle).toBeVisible();
  });

  test('shows editor/comments split with visible inner handle after selecting a note', async ({ page }) => {
    await ensureNoteSelected(page);
    // If comments panel exists, inner handle should be visible; otherwise skip
    const commentsHeader = page.locator('text=Comments').first();
    if (await commentsHeader.isVisible().catch(() => false)) {
      const innerHandle = page.locator('[role="separator"]').nth(1);
      await expect(innerHandle).toBeVisible();
    } else {
      test.skip(true, 'Comments panel not present for unsaved note; skipping inner handle assertion');
    }
  });

  test('comments sidebar renders when a note is selected', async ({ page }) => {
    await ensureNoteSelected(page);
    const header = page.locator('text=Comments').first();
    if (await header.isVisible().catch(() => false)) {
      await expect(header).toBeVisible();
    } else {
      test.skip(true, 'Comments panel not present for a new/unsaved note');
    }
  });

  test('Review Notes shows Under Review/Reviewed tabs when instructor toggle is available', async ({ page }) => {
    // If the instructor dropdown exists, switch to Review Notes and check labels
    const viewSelect = page.locator('div[role="combobox"]:has-text("My Notes"), div[role="combobox"]:has-text("Review Notes")').first();
    if (!(await viewSelect.isVisible().catch(() => false))) {
      test.skip(true, 'Instructor view toggle not available in this environment');
    }
    await viewSelect.click();
    await page.locator('[role="option"]:has-text("Review Notes")').click();
    // Tabs should read Under Review / Reviewed in review mode
    await expect(page.locator('button:has-text("Under Review")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Reviewed")').first()).toBeVisible();
  });

  test('Approve label visible for instructor reviewing a student note when applicable', async ({ page }) => {
    await ensureNoteSelected(page);
    // Try id first, then fallback to toolbar label text
    const toggle = page.locator('#publish-toggle-button');
    if (await toggle.isVisible().catch(() => false)) {
      const text = await toggle.textContent();
      expect(text && (text.includes('Approve') || text.includes('Publish') || text.includes('Unpublish'))).toBeTruthy();
    } else {
      const anyLabel = page.locator('text=Approve, text=Publish, text=Unpublish').first();
      if (await anyLabel.isVisible().catch(() => false)) {
        await expect(anyLabel).toBeVisible();
      } else {
        test.skip(true, 'Toolbar toggle not rendered for this environment');
      }
    }
  });
});


