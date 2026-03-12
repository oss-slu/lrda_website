# Where's Religion? -- Page Inventory

Current state of every page in the web app, what it does, and known issues.

---

## Navigation

**Always visible (logged out or in):** Home, Map, Stories, Resources

**Authenticated users:**

- Notes (instructors see a dropdown: "My Notes" / "Student Notes")
- Dashboard (routes to `/instructor-dashboard` or `/student-dashboard` based on role)

**Top right:** Login/Sign Up (logged out) or user dropdown with email and logout (logged in)

---

## Pages

### `/` -- Home

Welcome banner and about section introducing the Where's Religion? project. Static content.

### `/map` -- Map

General browsing page for all users. Interactive Google Maps interface with note markers, search/filter controls, and a side panel (Sidebar) for browsing notes by location. Toggles between "All Notes" (published notes from everyone) and "My Notes" (the current user's notes) via `mapStore.isGlobalView`.

This page is intentionally not part of the instructor/student workflow -- it does not show student notes for review. It serves both general researchers and instructor/student users as a way to explore published work and manage their own notes geographically.

### `/notes` -- Notes

Wrapper that renders the Notes component. This is the main note editing/browsing interface (the note editor with rich text, media uploads, location tagging, etc.).

### `/stories` -- Stories

Grid of published notes from all users. Has search, user filter, and sort options (newest/oldest/alphabetical). Supports infinite scroll. This is the public-facing "browse published work" page.

### `/resources` -- Resources

Static page listing online resources and further reading citations for ethnographic research.

### `/wheres-religion` -- Where's Religion?

Comprehensive info page with collapsible sections covering FAQs, a getting started guide, project background, and citation guidelines.

### `/admin` -- Admin Dashboard

Admin-only (redirects non-admins server-side). Three sections:

- Admin statistics (user counts, note counts, etc.)
- User management with role badges
- Pending instructor application approvals

### `/instructor-dashboard` -- Instructor Dashboard

Shows student submissions with search and student filter dropdown. Instructors can review notes, approve/reject them, and leave comments.

**Known issues:**

- No server-side route guard (unlike `/admin`). Non-instructors can navigate here and see an empty page.

### `/student-dashboard` -- Student Dashboard

Shows the student's notes that are awaiting instructor feedback (`approvalRequested && !published`). Displays recent comment previews from instructors. Has search by note title.

### `/login` -- Login

Email/password login form with "forgot password" link. Redirects to `/map` on success.

### `/signup` -- Sign Up

Registration form with name, email, password, and role selection (none / student / instructor). Conditionally shows:

- **Student:** instructor selector dropdown (fetched from API)
- **Instructor:** text area describing why they want to be an instructor (creates a pending application for admin approval)

### `/confirm` -- Confirmation

Post-signup page instructing the user to check their email for a verification link.

### `/forgot-password` -- Forgot Password

Email input form to request a password reset link.

### `/reset-password` -- Reset Password

Form to set a new password using a reset token from the URL.

### `/verify-email` -- Verify Email

Auto-verifies the email token if present in the URL. Shows a success message or a manual verify button.

---

## Functional Issues (Student/Instructor Workflows)

### Critical

1. **`requestApproval()` is a stub that always throws** -- `packages/web/app/lib/services/instructor.service.ts:42-54`. When a student clicks "Request Approval", the note gets updated with `approvalRequested: true` via `notesService.update()`, but then `requestApproval()` is called and throws. The student sees a success toast followed by an error toast. The note update itself works; the double-toast is the confusing part.

### Medium

2. **Sidebar search results not cleared on mode switch** -- `packages/web/app/lib/components/Sidebar.tsx:112-117`. Switching between "my notes" and "review" mode does not call `setSearchResults(null)`, so stale search results can bleed across modes.

3. **No UI to change instructor after signup** -- `assignInstructor()` exists in `users.service.ts:60-65` and the backend endpoint works, but no component ever calls it. Students who pick the wrong instructor at signup are stuck.

4. **Sidebar tab resets on mode switch** -- `Sidebar.tsx:201`. `defaultValue` is always `'unpublished'`, so the tab selection resets every time the user switches between my notes and review mode.

5. **Instructor dashboard has no server-side route guard** -- Unlike `/admin` which redirects non-admins, `/instructor-dashboard` has no redirect. Non-instructors see an empty page.

### Low / Missing Features

6. **No notification system** -- When a student requests approval, there is no real-time notification for the instructor. Instructors must manually check the dashboard or wait for the 15-second polling interval.

7. **No structured rejection reason** -- When an instructor declines a note, they can only leave comments. There is no dedicated rejection reason field surfaced differently from normal comments.

8. **No profile/settings page** -- No account management page exists. This is where instructor reassignment (issue #3) and other account settings would naturally live.

---

## User Modes

The app serves two distinct use cases:

1. **General researchers** -- Use the map to browse/explore published notes geographically, use stories to browse them as a list, create and publish their own notes. No instructor/student relationship involved.
2. **Instructor/student** -- Students create notes and submit them for instructor approval before publishing. Instructors review, comment on, and approve/reject student notes via their dashboard.

Both modes share the same core features (map, notes editor, stories). The instructor/student workflow adds the dashboards and the approval process on top.

## Open Questions

- **`/notes` vs `/map`**: Both show notes with a sidebar. Are these meant to be separate experiences, or should one be the primary workspace?
- **`/instructor-dashboard` vs `/student-dashboard`**: Separate pages per role. Could these be a single `/dashboard` that adapts based on role, or should they stay separate?
- **`/stories` vs map's "All Notes"**: Both show published notes from all users. Stories is a grid/list view, map is geographic. Are these intentionally complementary views of the same data?
