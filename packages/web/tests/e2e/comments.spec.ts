import { test, expect, type Page } from '@playwright/test';
import { authedPage } from './helpers/pw';
import {
  seedTestData,
  resetTestData,
  execute,
  TEST_USER_ID_2,
  TEST_INSTRUCTOR_ID,
  TEST_NOTE_USER2_ID,
} from '../helpers/db-seed';

const NOTE_TITLE = 'User 2 Draft';

test.beforeAll(async () => {
  await seedTestData();
  // Student submits the note for review so it appears in the instructor's queue
  await execute(`UPDATE "note" SET approval_requested = TRUE WHERE id = $1`, TEST_NOTE_USER2_ID);
});

test.afterAll(async () => {
  // resetTestData deletes comments on the seeded test notes and re-seeds
  await resetTestData();
});

// Direct page.goto() to authenticated routes hangs the dev SSR pass; navigate client-side.
async function gotoViaNav(page: Page, href: string, urlGlob: string): Promise<void> {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.locator(`nav a[href="${href}"]`).click();
  await page.waitForURL(urlGlob);
}

async function openComments(page: Page): Promise<void> {
  await page.getByText(NOTE_TITLE, { exact: false }).first().click();
  await page.getByRole('button', { name: /comments/i }).click();
  await expect(page.getByRole('heading', { name: 'Comments' })).toBeVisible();
}

test.describe('Comments - two users in one thread (UI)', () => {
  test('student and instructor comment in the same thread and see each others changes', async ({
    browser,
  }) => {
    const student = await authedPage(browser, TEST_USER_ID_2);
    const instructor = await authedPage(browser, TEST_INSTRUCTOR_ID);

    const studentComment = `student comment ${Date.now()}`;
    const instructorReply = `instructor reply ${Date.now()}`;

    // 1. Student opens their own note and posts a top-level comment
    await gotoViaNav(student, '/notes', '**/notes**');
    await openComments(student);
    await student.getByRole('button', { name: 'Add Comment' }).click();
    await student.getByPlaceholder('Write your comment...').fill(studentComment);
    await student.getByRole('button', { name: 'Submit' }).click();
    await expect(student.getByText(studentComment)).toBeVisible();

    // 2. Instructor opens the SAME note via the dashboard, SEES the student's
    //    comment, and replies in the same thread
    await gotoViaNav(instructor, '/instructor-dashboard', '**/instructor-dashboard**');
    await openComments(instructor);
    await expect(instructor.getByText(studentComment)).toBeVisible();
    await instructor.getByPlaceholder('Reply...').first().fill(instructorReply);
    await instructor.getByRole('button', { name: 'Reply' }).first().click();
    await expect(instructor.getByText(instructorReply)).toBeVisible();

    // 3. Student refetches (reload; comments poll every 15s) and sees the
    //    instructor's reply in the same thread alongside their own comment
    await student.reload();
    await student.waitForLoadState('networkidle');
    await openComments(student);
    await expect(student.getByText(studentComment)).toBeVisible();
    await expect(student.getByText(instructorReply)).toBeVisible();

    await student.context().close();
    await instructor.context().close();
  });
});
