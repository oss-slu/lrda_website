# Instructor Workflow

This page describes the instructor/student review workflow as implemented in the application.

## Principles

- **`/notes`** is the workspace for everyone -- researchers, students, and instructors writing their own notes. All note editing, status tracking, and feedback reading happens here.
- **`/instructor-dashboard`** is the dedicated space for instructors to review student submissions.
- The **map page** is for general browsing (all published notes / my notes). No instructor/student workflow here.
- `NoteEditor` is a reusable component rendered on both `/notes` and the instructor dashboard.
- There is no separate student dashboard. Students manage everything from `/notes`.

## Note Lifecycle

```
  Draft  (approvalRequested=false, published=false, isReturned=false)
    |
    | student clicks "Request Approval"
    v
  Pending  (approvalRequested=true, published=false, isReturned=false)
    |
    +--- student cancels ---> Draft
    |
    +--- instructor approves ---> Published  (published=true, approvalRequested=false)
    |
    +--- instructor declines ---> Returned   (isReturned=true, approvalRequested=false)
         |                                    (optional feedback comment)
         |
         | student revises and resubmits
         v
       Pending (again)
```

Status is determined by `getNoteStatus()` in `noteStatus.ts` with this priority:

1. `published` -> "published"
2. `isReturned` -> "returned"
3. `approvalRequested` -> "pending"
4. Otherwise -> "draft"

## Student Experience

### Notes Page (`/notes`)

The sidebar has two tabs: **Unpublished** and **Published**. Each note card shows a title, preview text, date, and a status badge.

Status badges:

- **Draft** (gray) -- not yet submitted
- **Pending** (yellow) -- waiting for instructor review
- **Returned** (orange) -- declined by instructor with feedback
- **Published** (green) -- approved and published

### Requesting Approval

The `PublishToggle` in the editor toolbar adapts based on the student's relationship:

**Student with instructor assigned:**
- **Draft**: "Request Approval" button submits for review
- **Pending**: "Cancel Approval Request" withdraws the submission
- **Published**: "Published" indicator with option to unpublish

**Student without instructor:**
- Standard "Publish" / "Unpublish" toggle (no approval flow)

### Reading Feedback

When an instructor leaves comments or declines a note, the student opens the comments panel on `/notes` to read feedback and reply to threads.

## Instructor Experience

### Instructor Dashboard (`/instructor-dashboard`)

The dashboard is a dedicated page for reviewing student submissions with a sidebar + editor layout.

The sidebar shows student notes with tabs for **Unreviewed** and **Reviewed**, plus a student filter dropdown and search bar.

Tab filtering:
- **Unreviewed**: `approvalRequested && !published && !isReturned`
- **Reviewed**: `published || isReturned`

### Reviewing a Note

Clicking a note loads it in the editor area (read-only). An **Approve/Decline header bar** appears when the selected note is unreviewed.

- Date and Location are read-only text (not interactive pickers)
- AutoSaveIndicator, PublishToggle, and Delete button are hidden
- Formatting toolbar is hidden
- The Approve/Decline buttons are in the dashboard header bar, not in the editor toolbar

For already-reviewed notes, the header bar is hidden and the editor shows read-only without actions.

### Approving a Note

Clicking "Approve" immediately publishes the note:
- `published=true`, `approvalRequested=false`, `isReturned=false`

### Declining a Note

Clicking "Decline" opens a dialog prompting for optional feedback. On confirm:
- If feedback text is provided, a comment is created on the note
- Note is updated: `published=false`, `approvalRequested=false`, `isReturned=true`
- Note moves from "Unreviewed" to "Reviewed" tab

### Comments

When the Comments button is clicked, a panel slides in from the right side of the editor. Comments are threaded -- instructors and students can reply to specific threads and resolve them.

## Pages Summary

| Page                    | Purpose                                      | Who Uses It |
| ----------------------- | -------------------------------------------- | ----------- |
| `/`                     | Home / about                                 | Everyone    |
| `/map`                  | Browse notes geographically                  | Everyone    |
| `/notes`                | Write, edit, track status, read feedback     | Everyone    |
| `/stories`              | Browse published notes as a list             | Everyone    |
| `/resources`            | Research resources and citations             | Everyone    |
| `/wheres-religion`      | FAQs, getting started, project info          | Everyone    |
| `/instructor-dashboard` | Review student submissions                   | Instructors |
| `/admin`                | User management, instructor approvals, stats | Admins      |

## Key Files

| File | Purpose |
| --- | --- |
| `app/lib/components/NoteEditor/NoteEditor.tsx` | Main editor orchestrator |
| `app/lib/components/NoteEditor/NoteElements/PublishToggle.tsx` | Role-aware publish/approval button |
| `app/lib/components/NoteEditor/NoteEditorComments.tsx` | Comments sidebar panel |
| `app/lib/components/NoteEditor/hooks/useNotePermissions.ts` | Permission derivation |
| `app/lib/utils/noteStatus.ts` | `getNoteStatus()`, `isUnreviewed()`, `isReviewed()` |
| `app/instructor-dashboard/InstructorDashboard.tsx` | Dashboard layout, approve/decline handlers |
| `app/instructor-dashboard/InstructorSidebar.tsx` | Submission queue with tabs and filters |
| `app/lib/components/Sidebar.tsx` | Notes page sidebar |
| `app/lib/components/note_listview.tsx` | Note card display with status badges |
