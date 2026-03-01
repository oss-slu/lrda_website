# Instructor/Student Workflow

This document describes the current instructor/student review workflow as implemented in the codebase.

---

## Principles

- **`/notes`** is the workspace for everyone -- general researchers, students, and instructors writing their own notes. All note editing, status tracking, and feedback reading happens here.
- **`/instructor-dashboard`** is the dedicated space for instructors to review student submissions.
- The **map page** is for general browsing (all published notes / my notes). No instructor/student workflow here.
- `NoteEditor` is a reusable component rendered on both `/notes` and the instructor dashboard.
- There is no separate student dashboard. Students manage everything from `/notes`.

---

## Note Editor Layout

The note editor uses a docs-like layout with a centered white canvas on a gray background.

### Structure

```
+-----------------------------------------------------------------------+
| Toolbar Row 1: Metadata + Actions                                     |
| [Date] [Location] [Download]            [Save status] | [Publish] ... |
+-----------------------------------------------------------------------+
| Toolbar Row 2: Formatting Controls (hidden in review mode)            |
| [B] [I] [U] [H1] [H2] [--] [img] [video] [audio] [link]             |
+-----------------------------------------------------------------------+
|                                                                       |
|          +-----------------------------------------------+            |
|          |                                               |            |
|          |  Note Title                                   |            |
|          |  -----------------------------------------    |            |
|          |                                               |            |
|          |  Note content here. Rich text with            |            |
|          |  formatting, embedded images, audio            |            |
|          |  players, video players, etc.                  |            |
|          |                                               |            |
|          |  Tags: [tag1] [tag2] [+ Add tag]              |            |
|          |                                               |            |
|          +-----------------------------------------------+            |
|                                                                       |
+-----------------------------------------------------------------------+
```

### Toolbar Actions by Role

**Student editing their own note (with instructor assigned):**

```
[Date picker] [Location picker] [Download] | [Saved] | [Request Approval] [Delete] [Comments]
```

- Date and Location are interactive pickers
- PublishToggle shows "Request Approval" (or "Cancel Approval Request" if pending)
- Comments button appears only for students who have an `instructorId` assigned

**Student editing their own note (no instructor):**

```
[Date picker] [Location picker] [Download] | [Saved] | [Publish/Unpublish] [Delete]
```

- No Comments button (no instructor relationship)
- PublishToggle shows "Publish" / "Unpublish" directly

**Instructor reviewing a student note:**

```
[Sun Mar 01 2026] [38.6270, -90.1994] [Download]                       [Comments]
```

- Date and Location are read-only text with icons (not interactive pickers)
- AutoSaveIndicator, PublishToggle, and Delete button are hidden
- Formatting toolbar (Row 2) is hidden
- The Approve/Decline buttons live in the dashboard header bar above, not in the editor toolbar

### Comments Panel

When the Comments button is clicked, a panel slides in from the right side of the editor. The left sidebar (note list) remains visible -- it does not collapse. Comments are threaded:

```
+----------+------------------------------+--------------------------+
| Sidebar  |                              | Comments        [X close]|
|          |   Note Editor Canvas         |                          |
| [notes]  |                              | +----------------------+ |
| [notes]  |   [content...]               | | Instructor - Jan 16  | |
| [notes]  |                              | | "Good work, but..."  | |
|          |                              | |                      | |
|          |                              | |  Student - Jan 17    | |
|          |                              | |  "Updated, thanks"   | |
|          |                              | |                      | |
|          |                              | |  [Reply...    ] [->] | |
|          |                              | |  [Resolve]           | |
|          |                              | +----------------------+ |
|          |                              |                          |
|          |                              | [New comment...  ] [->]  |
+----------+------------------------------+--------------------------+
```

---

## `/notes` Page

The notes page is the main workspace for all users. It uses a sidebar + editor layout.

### Sidebar

The sidebar has two tabs: **Unpublished** and **Published**. Each note card shows a title, preview text, date, and (for students) a status badge.

```
+---------------------------+
|  [Unpublished] [Published]|
|                           |
|  +---------------------+  |
|  | Note Title          |  |
|  | Preview text...     |  |
|  | Jan 15     [Draft]  |  |
|  +---------------------+  |
|                           |
|  +---------------------+  |
|  | Another Note        |  |
|  | Preview text...     |  |
|  | Jan 14   [Pending]  |  |
|  +---------------------+  |
|                           |
|  +---------------------+  |
|  | Returned Note       |  |
|  | Preview text...     |  |
|  | Jan 13  [Returned]  |  |
|  +---------------------+  |
|                           |
+---------------------------+
```

Status badges (from `noteStatus.ts`):
- **Draft** (gray) -- not yet submitted
- **Pending** (yellow) -- `approvalRequested=true`, waiting for instructor review
- **Returned** (orange) -- `isReturned=true`, declined by instructor
- **Published** (green) -- `published=true`, approved and published

### Student: Request Approval

The "Request Approval" button is the `PublishToggle` component in the editor toolbar. For students with an instructor assigned, the toggle shows:

- **Draft**: "Request Approval" (blue) -- submits for review
- **Pending**: "Cancel Approval Request" (yellow) -- withdraws the submission
- **Published**: "Published" (green) -- can unpublish

### Student: View Instructor Feedback

When an instructor leaves comments or declines a note, the student opens the comments panel on `/notes` to read feedback. Students can reply to comment threads.

---

## Instructor Dashboard (`/instructor-dashboard`)

The instructor dashboard is a dedicated page for reviewing student submissions. It uses a sidebar + editor layout.

### Sidebar: Submission Queue

The sidebar shows student notes with tabs for **Unreviewed** and **Reviewed**, plus a student filter dropdown and search bar.

```
+-----------------------------------------------------------------------+
| Navbar                                                    [user menu] |
+-----------------------------------------------------------------------+
| [Search notes...]           [Filter by student: All Students v]       |
+---------------------------+-------------------------------------------+
|  [Unreviewed] [Reviewed]  |                                           |
|                           |   Select a note to review                 |
|  +---------------------+  |                                           |
|  | Note Title          |  |                                           |
|  | Student Name        |  |                                           |
|  | Jan 15    [Pending] |  |                                           |
|  +---------------------+  |                                           |
|                           |                                           |
|  +---------------------+  |                                           |
|  | Another Note        |  |                                           |
|  | Student Name        |  |                                           |
|  | Jan 14    [Pending] |  |                                           |
|  +---------------------+  |                                           |
|                           |                                           |
+---------------------------+-------------------------------------------+
```

Tab filtering (from `noteStatus.ts`):
- **Unreviewed**: `approvalRequested && !published && !isReturned`
- **Reviewed**: `published || isReturned`

### Reviewing a Note

Clicking a note loads it in the editor area (read-only). An **Approve/Decline header bar** appears between the sidebar and the editor when the selected note is unreviewed.

```
+---------------------------+-------------------------------------------+
|  [Unreviewed] [Reviewed]  | [Decline]                       [Approve] |
|                           +-------------------------------------------+
|  +---------------------+  | [Sun Mar 01 2026] [38.62, -90.19] [Down.] |
|  | > Note Title     <--+--+---[Comments]----------------------------------+
|  |   Student Name      |  |                                           |
|  |   Jan 15            |  |  +-------------------------------------+  |
|  +---------------------+  |  |                                     |  |
|                           |  |  Note Title                         |  |
|  +---------------------+  |  |  --------------------------------   |  |
|  | Another Note        |  |  |                                     |  |
|  | Student Name        |  |  |  [Full note content, read-only]     |  |
|  | Jan 14              |  |  |                                     |  |
|  +---------------------+  |  +-------------------------------------+  |
|                           |                                           |
+---------------------------+-------------------------------------------+
```

The header bar only appears for unreviewed notes. For already-reviewed notes (published or returned), the header bar is hidden and the editor shows the note in read-only mode without approve/decline actions.

### Declining a Note

When the instructor clicks "Decline", a dialog prompts for optional feedback. The feedback is posted as a comment, and the note is marked as returned.

```
+------------------------------------------+
|  Decline Submission                      |
|                                          |
|  Optionally provide feedback for the     |
|  student. The note will be returned      |
|  for revision.                           |
|                                          |
|  +------------------------------------+  |
|  | Your observations about the        |  |
|  | ritual need more specific          |  |
|  | details about...                   |  |
|  +------------------------------------+  |
|                                          |
|  [Cancel]           [Return to Student]  |
+------------------------------------------+
```

On confirm:
- If feedback text is provided, a comment is created on the note
- Note is updated: `published=false`, `approvalRequested=false`, `isReturned=true`
- Note moves from the "Unreviewed" tab to the "Reviewed" tab

### Approving a Note

Clicking "Approve" immediately publishes the note:
- Note is updated: `published=true`, `approvalRequested=false`, `isReturned=false`
- Selection is cleared

---

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

`isReturned` is a boolean field on the `Note` type. The status is determined by `getNoteStatus()` in `noteStatus.ts` with this priority order:
1. `published` -> "published"
2. `isReturned` -> "returned"
3. `approvalRequested` -> "pending"
4. Otherwise -> "draft"

---

## Pages

| Page | Purpose | Who uses it |
|------|---------|-------------|
| `/` | Home / about | Everyone |
| `/map` | Browse notes geographically | Everyone |
| `/notes` | Write, edit, track status, read feedback | Everyone |
| `/stories` | Browse published notes as a list | Everyone |
| `/resources` | Research resources and citations | Everyone |
| `/wheres-religion` | FAQs, getting started, project info | Everyone |
| `/instructor-dashboard` | Review student submissions | Instructors |
| `/admin` | User management, instructor approvals, stats | Admins |

---

## Key Files

| File | Purpose |
|------|---------|
| `app/lib/components/NoteEditor/NoteEditor.tsx` | Main editor orchestrator; toolbar layout, permission-based conditional rendering |
| `app/lib/components/NoteEditor/NoteEditorToolbar.tsx` | Left toolbar segment: date, location (read-only or interactive), download |
| `app/lib/components/NoteEditor/NoteElements/PublishToggle.tsx` | Role-aware publish/approval button |
| `app/lib/components/NoteEditor/AutoSaveIndicator.tsx` | Save status display |
| `app/lib/components/NoteEditor/NoteEditorComments.tsx` | Comments sidebar panel |
| `app/lib/components/NoteEditor/hooks/useNotePermissions.ts` | Derives `isViewingStudentNote`, `canComment`, etc. from auth state |
| `app/lib/utils/noteStatus.ts` | `getNoteStatus()`, `isUnreviewed()`, `isReviewed()` predicates |
| `app/instructor-dashboard/InstructorDashboard.tsx` | Dashboard layout, approve/decline handlers, decline dialog |
| `app/instructor-dashboard/InstructorSidebar.tsx` | Submission queue with tabs, student filter, search |
| `app/lib/components/Sidebar.tsx` | Notes page sidebar with Unpublished/Published tabs |
| `app/lib/components/note_listview.tsx` | Note card display with status badges |
