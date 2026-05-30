# Communities and Notes Design

This document describes the target design for communities, note publishing, and comments. It replaces the existing instructor/student model.

## Communities

A community is a group of users who can share and review notes together.

### Roles

- **Owner** -- the user who created the community. Full control over settings and membership.
- **Moderator** -- can review submitted notes and manage members. Appointed by the owner.
- **Member** -- can submit notes to the community.

### Settings

- **Visibility**: public (anyone can join) or private (invite-only).
- **Review required**: toggle. When enabled, notes submitted to the community must be reviewed by a moderator before publishing. When disabled, submitting to the community publishes immediately.

### Membership

- A user can belong to multiple communities.
- A user can own multiple communities.
- A user does not need to belong to any community to use the app.

## Notes

### States

| State | Meaning | Visibility |
|-------|---------|------------|
| Draft | Work in progress, not submitted | Author only |
| Submitted | Sent to a community's review queue | Author + community moderators |
| Published | Finalized and public | Everyone |

### Publishing Paths

- **Independent** (no community): Draft -> Published. The author publishes directly with no review.
- **Community without review**: Draft -> Published. Submitting to the community publishes immediately.
- **Community with review**: Draft -> Submitted -> Published. A moderator must approve before the note becomes public.

### Ownership

- A note belongs to one community or none.
- Published notes are always public regardless of community membership or settings.

## Comments

Comments are anchored to specific content within a note, similar to Google Docs.

### Anchoring

Each comment is attached to a quoted snippet of text and an approximate position within the note. This allows comments to survive minor edits to the note content.

- The quoted text is stored with the comment.
- On render, the system searches for the quoted text in the current note content and positions the comment there.
- If the quoted text can no longer be found (due to edits or deletion), the comment becomes unanchored. Unanchored comments are still visible but are no longer tied to a specific location.

### Threads

Each anchored comment is the root of a thread. Other users can reply within that thread. This keeps discussion organized around specific points in the note.

### Resolution

A thread can be resolved by the note author or a moderator. Resolved threads are hidden from the default view but not deleted. They can be shown again if needed.

### Visibility Scope

Each comment has a visibility scope:

- **review** -- visible only to the note author and community moderators. Used during the review process for submitted notes.
- **public** -- (future) visible to anyone viewing the published note.

Starting with `review` scope only. The `public` scope can be added later without schema changes by creating comments with `public` visibility on published notes.
