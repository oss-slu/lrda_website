# Notes Editor

The notes editor is the core authoring experience. It provides rich text editing, media embedding, location tagging, and a structured review workflow.

## Overview

The editor is built around [Tiptap](https://tiptap.dev/), a headless rich text editor for React, with a toolbar for formatting controls and metadata actions. The same `NoteEditor` component is used on both the `/notes` page (for authoring) and the `/instructor-dashboard` (for reviewing, in read-only mode).

## Editor Layout

```
+-----------------------------------------------------------------------+
| Toolbar Row 1: Metadata + Actions                                     |
| [Date] [Location] [Download]            [Save status] | [Publish] ... |
+-----------------------------------------------------------------------+
| Toolbar Row 2: Formatting Controls                                    |
| [B] [I] [U] [H1] [H2] [--] [img] [video] [audio] [link]             |
+-----------------------------------------------------------------------+
|                                                                       |
|          +-----------------------------------------------+            |
|          |  Note Title                                   |            |
|          |  -----------------------------------------    |            |
|          |  Note content with rich text formatting,      |            |
|          |  embedded images, audio players, etc.          |            |
|          |                                               |            |
|          |  Tags: [tag1] [tag2] [+ Add tag]              |            |
|          +-----------------------------------------------+            |
+-----------------------------------------------------------------------+
```

## Key Features

- **Rich text formatting**: Bold, italic, underline, headings, horizontal rules, links
- **Media embedding**: Images, video, and audio clips can be attached and embedded inline
- **Location picker**: Select geographic coordinates via Google Maps
- **Date/time picker**: Set the date and time for each note
- **Tag management**: Add, remove, and manage tags for thematic organization
- **Auto-save**: Changes are saved automatically with a status indicator
- **Publishing**: Toggle between draft and published states (or request approval for students with instructors)

## Key Files

| File | Purpose |
| --- | --- |
| `app/lib/components/NoteEditor/NoteEditor.tsx` | Main editor orchestrator |
| `app/lib/components/NoteEditor/NoteEditorToolbar.tsx` | Toolbar with date, location, download |
| `app/lib/components/NoteEditor/NoteElements/PublishToggle.tsx` | Role-aware publish/approval button |
| `app/lib/components/NoteEditor/AutoSaveIndicator.tsx` | Save status display |
| `app/lib/components/NoteEditor/NoteEditorComments.tsx` | Comments sidebar panel |
| `app/lib/components/NoteEditor/hooks/useNotePermissions.ts` | Permission derivation from auth state |
