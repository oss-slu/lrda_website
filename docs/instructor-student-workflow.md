# Instructor/Student Workflow Design

This document outlines the ideal workflow for the instructor/student review process, including wireframes for key views.

---

## Principles

- **`/notes`** is the workspace for everyone -- general researchers, students, and instructors writing their own notes. All note editing, status tracking, and feedback reading happens here.
- **`/instructor-dashboard`** is the dedicated space for instructors to review student submissions. Instructors never leave this page during the review process.
- The **map page** is for general browsing (all published notes / my notes). No instructor/student workflow here.
- `NoteEditor` is a reusable component rendered on both `/notes` and the instructor dashboard.
- There is no separate student dashboard. Students manage everything from `/notes`.

---

## Note Editor Design (Docs-like)

The note editor should feel like a document editor (Google Docs style). Clean canvas, focused writing area, toolbar at top.

### Layout Pattern: Sidebar / Editor / Comments

The editor uses a three-zone layout where only two zones are visible at a time. The sidebar (left) and comments panel (right) share space -- opening one closes the other. The editor canvas always occupies the remaining width.

```
Default (sidebar open):              Comments open (sidebar closes):

+----------+---------------------+   +---------------------+----------+
| Sidebar  |                     |   |                     | Comments |
| (note    |   Note Editor       |   |   Note Editor       |          |
|  list)   |   Canvas            |   |   Canvas            | [thread] |
|          |                     |   |                     | [thread] |
| [notes]  |   [content...]      |   |   [content...]      |          |
| [notes]  |                     |   |                     | [reply]  |
| [notes]  |                     |   |                     |          |
+----------+---------------------+   +---------------------+----------+
```

### Editor Canvas

The editor canvas itself is docs-like:
- White page area centered on a subtle background
- Toolbar pinned to the top (formatting, media upload, etc.)
- Title field at the top of the document
- Location and metadata below the title
- Content area fills the rest

```
+-----------------------------------------------------------------------+
|  [B] [I] [U] [H1] [H2] [--] [img] [video] [audio] [link]   [Comment]|
+-----------------------------------------------------------------------+
|                                                                       |
|          +-----------------------------------------------+            |
|          |                                               |            |
|          |  Note Title                                   |            |
|          |  Location: Springfield, IL  |  Jan 15, 2026   |            |
|          |  -----------------------------------------    |            |
|          |                                               |            |
|          |  Note content here. Rich text with            |            |
|          |  formatting, embedded images, audio            |            |
|          |  players, video players, etc.                  |            |
|          |                                               |            |
|          |  [image]                                       |            |
|          |                                               |            |
|          |  More content...                               |            |
|          |                                               |            |
|          +-----------------------------------------------+            |
|                                                                       |
+-----------------------------------------------------------------------+
```

### Comments Panel (Right Side)

When the user clicks the "Comment" button in the toolbar (or a comment indicator), the sidebar closes and the comments panel slides in from the right. Clicking a close button on the comments panel closes it and reopens the sidebar.

Comments are threaded, similar to Google Docs:

```
+---------------------+-------------------------------+
|                     |  Comments            [X close] |
|   Note Editor       |                               |
|   Canvas            |  +---------------------------+ |
|                     |  | Instructor - Jan 16       | |
|   [content...]      |  | "Good observations, but   | |
|                     |  |  need more detail on..."  | |
|                     |  |                           | |
|                     |  |  Student - Jan 17         | |
|                     |  |  "Thanks, I updated..."   | |
|                     |  |                           | |
|                     |  |  [Reply...         ] [->] | |
|                     |  |                           | |
|                     |  |  [Resolve]                | |
|                     |  +---------------------------+ |
|                     |                               |
|                     |  +---------------------------+ |
|                     |  | Instructor - Jan 16       | |
|                     |  | "Citation needed here"    | |
|                     |  |                           | |
|                     |  |  [Reply...         ] [->] | |
|                     |  |                           | |
|                     |  |  [Resolve]                | |
|                     |  +---------------------------+ |
|                     |                               |
|                     |  [New comment...      ] [->]  |
|                     |                               |
+---------------------+-------------------------------+
```

---

## `/notes` Page

The notes page is the main workspace for all users. It uses the sidebar/editor/comments layout described above.

### Sidebar

The sidebar has two tabs: **Unpublished** and **Published**. Each note card shows a title, date, and (for students) a status badge.

**For general researchers (no instructor assigned):**
- Unpublished tab: drafts
- Published tab: published notes
- No status badges needed

**For students (assigned to an instructor):**
- Unpublished tab: drafts + pending + returned notes
- Published tab: approved and published notes
- Status badges on each note card:

```
+---------------------------+
|  Sidebar                  |
|                           |
|  [Unpublished] [Published]|
|                           |
|  +---------------------+  |
|  | Note Title          |  |
|  | Jan 15     [Draft]  |  |
|  +---------------------+  |
|                           |
|  +---------------------+  |
|  | Another Note        |  |
|  | Jan 14   [Pending]  |  |
|  +---------------------+  |
|                           |
|  +---------------------+  |
|  | Returned Note       |  |
|  | Jan 13  [Returned]  |  |
|  +---------------------+  |
|                           |
+---------------------------+
```

Status badges:
- **Draft** (default, gray) -- not yet submitted
- **Pending** (yellow) -- `approvalRequested=true`, waiting for instructor
- **Returned** (orange) -- declined by instructor, has feedback comments
- **Published** (green) -- approved and published (shown in Published tab)

### Student: Request Approval

The "Request Approval" button appears in the editor for students who have an instructor assigned. It is part of the editor toolbar or footer area.

```
+----------+--------------------------------------------------------+
| Sidebar  |  [B] [I] [U] [H1] [H2] [--] [img] [audio]  [Comment] |
|          +--------------------------------------------------------+
| [notes]  |                                                        |
| [notes]  |        +------------------------------------------+    |
| [notes]  |        |                                          |    |
|          |        |  Note Title                              |    |
|          |        |  Location: Springfield, IL               |    |
|          |        |  ----------------------------------------|    |
|          |        |                                          |    |
|          |        |  Note content...                         |    |
|          |        |                                          |    |
|          |        +------------------------------------------+    |
|          |                                                        |
|          |        [Request Approval]                              |
|          |                                                        |
+----------+--------------------------------------------------------+
```

After clicking, the button changes to show the pending state with an option to cancel:

```
          [Pending Approval]  [Cancel Request]
```

### Student: View Instructor Feedback

When an instructor leaves comments on a student's note, the student opens the comments panel to read them. The student can reply to comments. This all happens on `/notes` -- no separate dashboard.

```
+--------------------------------------------+-------------------------+
|  [B] [I] [U] [H1] [H2]          [Comment] |  Comments      [X close]|
+--------------------------------------------+                         |
|                                            |  +-------------------+  |
|        +------------------------------+    |  | Instructor        |  |
|        |                              |    |  | "Your observations|  |
|        |  Note Title                  |    |  |  need more..."    |  |
|        |  Location: Springfield, IL   |    |  |                   |  |
|        |  ----------------------------|    |  |  [Reply...  ] [->]|  |
|        |                              |    |  +-------------------+  |
|        |  Note content...             |    |                         |
|        |                              |    |  [New comment... ] [->] |
|        +------------------------------+    |                         |
|                                            |                         |
|        [Request Approval]                  |                         |
|                                            |                         |
+--------------------------------------------+-------------------------+
```

---

## Instructor Dashboard (`/instructor-dashboard`)

The instructor dashboard is a dedicated page for reviewing student submissions. It uses the same sidebar/editor/comments layout but configured for the review workflow.

### Sidebar: Submission Queue

The sidebar shows student notes submitted for review. It has tabs for **Unreviewed** and **Reviewed**, plus a student filter and search.

```
+-----------------------------------------------------------------------+
| Navbar                                                    [user menu] |
+-----------------------------------------------------------------------+
| [Search notes...]           [Filter by student: All Students v]       |
+---------------------------+-------------------------------------------+
|  Submissions              |                                           |
|                           |   Select a note to review                 |
|  [Unreviewed] [Reviewed]  |                                           |
|                           |                                           |
|  +---------------------+  |                                           |
|  | Note Title          |  |                                           |
|  | Student Name        |  |                                           |
|  | Jan 15, 2026        |  |                                           |
|  +---------------------+  |                                           |
|                           |                                           |
|  +---------------------+  |                                           |
|  | Another Note        |  |                                           |
|  | Student Name        |  |                                           |
|  | Jan 14, 2026        |  |                                           |
|  +---------------------+  |                                           |
|                           |                                           |
+---------------------------+-------------------------------------------+
```

### Reviewing a Note

Clicking a note loads it in the editor area (read-only). Review controls (Approve / Decline / Comments) appear above the note.

```
+---------------------------+-------------------------------------------+
|  Submissions              |  Note Title                               |
|                           |  by Student Name  |  Jan 15, 2026         |
|  [Unreviewed] [Reviewed]  |  Location: Springfield, IL                |
|                           |                                           |
|  +---------------------+  |  [Approve]  [Decline]  [Comments]        |
|  | > Note Title     <--+--+-------------------------------------------+
|  |   Student Name      |  |                                           |
|  |   Jan 15, 2026      |  |  +-------------------------------------+ |
|  +---------------------+  |  |                                     | |
|                           |  |  [Full note content, read-only]     | |
|  +---------------------+  |  |  [Rich text, images, audio, video]  | |
|  | Another Note        |  |  |                                     | |
|  | Student Name        |  |  |  More content...                    | |
|  | Jan 14, 2026        |  |  |                                     | |
|  +---------------------+  |  +-------------------------------------+ |
|                           |                                           |
+---------------------------+-------------------------------------------+
```

### Reviewing with Comments Open

Clicking "Comments" closes the submission sidebar and opens the comments panel on the right.

```
+-------------------------------------------+---------------------------+
|  Note Title                               |  Comments        [X close]|
|  by Student Name  |  Jan 15, 2026         |                           |
|  Location: Springfield, IL                |  +---------------------+  |
|                                           |  | Instructor - Jan 16 |  |
|  [Approve]  [Decline]  [Comments]         |  | "Good work, but..." |  |
+-------------------------------------------+  |                     |  |
|                                           |  |  Student - Jan 17   |  |
|  +-------------------------------------+  |  |  "Updated, thanks"  |  |
|  |                                     |  |  |                     |  |
|  |  [Full note content, read-only]     |  |  |  [Reply...   ] [->] |  |
|  |  [Rich text, images, audio, video]  |  |  |  [Resolve]          |  |
|  |                                     |  |  +---------------------+  |
|  |  More content...                    |  |                           |
|  |                                     |  |  [New comment...  ] [->]  |
|  +-------------------------------------+  |                           |
|                                           |                           |
+-------------------------------------------+---------------------------+
```

Closing the comments panel reopens the submission sidebar.

### Declining a Note

When the instructor clicks "Decline", a dialog prompts for feedback. The feedback is posted as a comment, and `approvalRequested` is reset so the student knows to revise.

```
+------------------------------------------+
|  Decline Note                            |
|                                          |
|  Leave feedback for the student:         |
|  +------------------------------------+  |
|  | Your observations about the        |  |
|  | ritual need more specific          |  |
|  | details about...                   |  |
|  +------------------------------------+  |
|                                          |
|  [Cancel]                [Send & Decline]|
+------------------------------------------+
```

---

## Note Lifecycle States

```
  Draft
    |
    | student clicks "Request Approval"
    v
  Pending Approval  (approvalRequested=true, published=false)
    |
    +--- student cancels ---> Draft
    |
    +--- instructor approves ---> Published  (approvalRequested=false, published=true)
    |
    +--- instructor declines ---> Returned   (approvalRequested=false, published=false)
         |                                     (with feedback comment)
         |
         | student revises and resubmits
         v
       Pending Approval (again)
```

Note: "Returned" is not a separate database state -- it is a draft (`approvalRequested=false, published=false`) that has instructor comments on it. The UI can distinguish it from a fresh draft by checking if the note has comment threads.

---

## Changes from Current Implementation

1. **Remove view mode toggle from `/notes` and navbar.** The notes page is always "my notes" for everyone. No "Student Notes" dropdown for instructors.

2. **Remove `/student-dashboard`.** Students manage everything from `/notes`. The notes sidebar shows status badges (Draft / Pending / Returned) and the comments panel shows instructor feedback.

3. **Make the note editor docs-like.** Clean canvas, centered page area, toolbar at top. Same component used on `/notes` and the instructor dashboard.

4. **Add sidebar/comments panel swap.** Opening comments closes the sidebar (note list), closing comments reopens the sidebar. Comments panel is always on the right side.

5. **Add status badges to notes sidebar.** For students with an instructor assigned, show Draft / Pending / Returned / Published badges on note cards.

6. **Rebuild instructor dashboard with shared layout.** Sidebar = submission queue with tabs (Unreviewed / Reviewed) and filters. Editor area = `NoteEditor` (read-only) with approve/decline controls. Comments panel = instructor feedback.

7. **Add decline dialog.** When instructor clicks "Decline", prompt for feedback that gets posted as a comment before resetting `approvalRequested`.

8. **Fix `requestApproval()` stub.** Either implement it properly or remove the call since `notesService.update()` already sets the flag.

---

## Pages After Changes

| Page | Purpose | Who uses it |
|------|---------|-------------|
| `/` | Home / about | Everyone |
| `/map` | Browse notes geographically (all notes / my notes) | Everyone |
| `/notes` | Write, edit, track status, read feedback (docs-like editor) | Everyone |
| `/stories` | Browse published notes as a list | Everyone |
| `/resources` | Research resources and citations | Everyone |
| `/wheres-religion` | FAQs, getting started, project info | Everyone |
| `/instructor-dashboard` | Review student submissions | Instructors |
| `/admin` | User management, instructor approvals, stats | Admins |

### Removed Pages

| Page | Reason |
|------|--------|
| `/student-dashboard` | Students manage everything from `/notes` now |

---

## Implementation Plan

Work is split into four chunks, done one at a time. Each chunk gets its own plan before implementation starts.

### Chunk 1: Docs-like Editor Restyle

Rework the `/notes` page layout and NoteEditor styling. Keep Tiptap/mui-tiptap, restyle everything around it.

- Centered white canvas on subtle background
- Clean toolbar pinned to top
- Title and metadata at top of the document canvas
- Empty state with "Create Note" prompt when no note is selected (plus "New Note" button in sidebar)
- No functional changes to the editor itself, just layout and visual

### Chunk 2: Sidebar/Comments Panel Swap

New interaction pattern: opening comments closes the sidebar, closing comments reopens the sidebar. Comments panel on the right side.

- Add comments panel component (right side, threaded, Google Docs style)
- "Comment" button in toolbar toggles the panel
- Sidebar collapses when comments open, restores when comments close
- Smooth transition between the two states

### Chunk 3: Status Badges + Remove Student Dashboard

Student workflow lives entirely on `/notes`.

- Add status badges to sidebar note cards (Draft / Pending / Returned)
- "Returned" detection: unpublished draft with instructor comment threads
- Remove view mode toggle from navbar and notesStore
- Delete `/student-dashboard` page
- Update navbar links (students no longer see "Dashboard")
- Fix `requestApproval()` stub

### Chunk 4: Rebuild Instructor Dashboard

Dedicated review page using the same layout components from chunks 1-2.

- Sidebar = submission queue (Unreviewed / Reviewed tabs, student filter, search)
- Editor area = NoteEditor in read-only mode with approve/decline controls
- Comments panel = same component from chunk 2
- Decline dialog with required feedback comment
